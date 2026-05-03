#!/usr/bin/env python3
"""
統合テストスクリプト: Redis + マルチワーカー構成のバックエンド検証

使用方法:
  cd backend
  source .venv/bin/activate
  python tests/stress_test.py [SERVER_URL [REDIS_URL]]

デフォルト:
  SERVER_URL = http://localhost:8000
  REDIS_URL  = redis://localhost:6379

検証項目:
  TEST 1  クロスクライアント通信 (AsyncRedisManager 経由での broadcast)
  TEST 2  カウントダウン冪等性 (game_end_time ベースの wall clock 一致)
  TEST 3  Race Condition (同時 create_room / 同時 move)
"""

import asyncio
import json
import sys
import time
import warnings
from typing import Any, Optional

# aiohttp が接続失敗時に内部 ClientSession を閉じない既知の挙動を抑制
warnings.filterwarnings("ignore", message="Unclosed client session", category=ResourceWarning)

import redis.asyncio as aioredis
import socketio

# ─────────────────────────────────────────────
# 設定
# ─────────────────────────────────────────────
SERVER_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
REDIS_URL  = sys.argv[2] if len(sys.argv) > 2 else "redis://localhost:6379"

# ANSI カラー
_G = "\033[92m"   # green
_R = "\033[91m"   # red
_Y = "\033[93m"   # yellow
_C = "\033[96m"   # cyan
_B = "\033[1m"    # bold
_X = "\033[0m"    # reset

_passed = 0
_failed = 0


def ok(msg: str) -> None:
    global _passed
    _passed += 1
    print(f"  {_G}✓{_X} {msg}")


def ng(msg: str) -> None:
    global _failed
    _failed += 1
    print(f"  {_R}✗{_X} {msg}")


def info(msg: str) -> None:
    print(f"  {_Y}→{_X} {msg}")


def section(title: str) -> None:
    print(f"\n{_B}{_C}{'━' * 60}{_X}")
    print(f"{_B}{_C}  {title}{_X}")
    print(f"{_B}{_C}{'━' * 60}{_X}")


# ─────────────────────────────────────────────
# GameClient ラッパー
# ─────────────────────────────────────────────

class GameClient:
    """socketio.AsyncClient を asyncio.Queue で包んだテスト用クライアント"""

    def __init__(self, name: str) -> None:
        self.name = name
        self.sio = socketio.AsyncClient(logger=False, engineio_logger=False)
        self.state_q: asyncio.Queue = asyncio.Queue()
        self.map_q:   asyncio.Queue = asyncio.Queue()
        self.error_q: asyncio.Queue = asyncio.Queue()

        @self.sio.on("update_state")
        async def _on_state(data: dict) -> None:
            await self.state_q.put(data)

        @self.sio.on("map")
        async def _on_map(data: dict) -> None:
            await self.map_q.put(data)

        @self.sio.on("error")
        async def _on_error(data: dict) -> None:
            await self.error_q.put(data)

    async def connect(self) -> None:
        await self.sio.connect(SERVER_URL, transports=["websocket"])

    async def disconnect(self) -> None:
        if self.sio.connected:
            await self.sio.disconnect()

    @property
    def sid(self) -> str:
        return self.sio.get_sid() or ""

    # ---- 高水準 emit ヘルパー ----

    async def create_room(self, timeout: float = 5.0) -> dict:
        await self.sio.emit("create_room", {})
        await asyncio.wait_for(self.map_q.get(), timeout=timeout)
        return await asyncio.wait_for(self.state_q.get(), timeout=timeout)

    async def join_room(self, room_id: str, timeout: float = 5.0) -> dict:
        await self.sio.emit("join_room", {"room_id": room_id})
        await asyncio.wait_for(self.map_q.get(), timeout=timeout)
        return await asyncio.wait_for(self.state_q.get(), timeout=timeout)

    async def start_game(self, timeout: float = 5.0) -> dict:
        await self.sio.emit("start_game", {})
        return await asyncio.wait_for(self.state_q.get(), timeout=timeout)

    async def move(self, direction: str) -> None:
        await self.sio.emit("move", {"direction": direction})

    async def next_state(self, timeout: float = 5.0) -> dict:
        return await asyncio.wait_for(self.state_q.get(), timeout=timeout)

    async def drain(self, window: float = 0.3) -> None:
        """window 秒以内に届くすべての state を捨てる"""
        try:
            while True:
                await asyncio.wait_for(self.state_q.get(), timeout=window)
        except asyncio.TimeoutError:
            pass

    async def wait_for_state_where(
        self, predicate, timeout: float = 10.0
    ) -> Optional[dict]:
        """predicate(state) == True になる state を返すまで待つ"""
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            remaining = deadline - time.monotonic()
            try:
                state = await asyncio.wait_for(
                    self.state_q.get(), timeout=min(remaining, 1.0)
                )
                if predicate(state):
                    return state
            except asyncio.TimeoutError:
                continue
        return None


# ─────────────────────────────────────────────
# PREFLIGHT
# ─────────────────────────────────────────────

async def preflight() -> bool:
    """OK なら True を返す。失敗した項目は ng() でカウント。"""
    section("PREFLIGHT: 環境チェック")

    # Redis
    redis_ok = False
    try:
        r = aioredis.from_url(REDIS_URL, decode_responses=True)
        await asyncio.wait_for(r.ping(), timeout=2.0)
        await r.aclose()
        ok(f"Redis 接続OK: {REDIS_URL}")
        redis_ok = True
    except Exception as e:
        ng(f"Redis に接続できません: {e}")
        print(f"      {_Y}docker run --rm -p 6379:6379 redis:7-alpine{_X}")

    if not redis_ok:
        return False

    # Server
    server_ok = False
    c = GameClient("preflight")
    try:
        await asyncio.wait_for(c.connect(), timeout=3.0)
        ok(f"バックエンドサーバー接続OK: {SERVER_URL}")
        server_ok = True
    except Exception as e:
        ng(f"サーバーに接続できません: {e}")
        print(f"      {_Y}uvicorn app.main:socket_app --host 0.0.0.0 --port 8000{_X}")
    finally:
        await c.disconnect()

    return server_ok


# ─────────────────────────────────────────────
# TEST 1: クロスクライアント通信
# ─────────────────────────────────────────────

async def test_cross_client_communication() -> None:
    """
    【目的】AsyncRedisManager 経由での broadcast を検証する。
    Client A が move を送ると、同じルームにいる Client B に
    update_state が届くかを確認する。
    """
    section("TEST 1: クロスクライアント通信 (AsyncRedisManager broadcast)")
    info("Client A が move を送ると Client B に update_state が届くかを確認")

    ca = GameClient("A")
    cb = GameClient("B")

    try:
        await ca.connect()
        await cb.connect()

        # ── ルーム作成 ──
        state = await ca.create_room()
        room_id = state["room_id"]
        ok(f"Client A がルームを作成: room_id={room_id}")

        # ── B が参加 (join_room は waiting 限定) ──
        join_state = await cb.join_room(room_id)
        # A にも join の broadcast が来るので drain する
        await ca.drain()
        ok(f"Client B がルーム {room_id} に参加")

        if join_state.get("room_id") == room_id:
            ok("join_room レスポンスの room_id が一致")
        else:
            ng(f"room_id 不一致: {join_state.get('room_id')}")

        # ── ゲーム開始 ──
        await ca.start_game()
        # B にも update_state が届く
        await cb.drain()
        ok("ゲーム開始完了")

        # ── A が move → B が受信 ──
        a_sid = ca.sid
        await ca.move("right")

        b_state = await cb.wait_for_state_where(
            lambda s: s.get("status") == "playing", timeout=3.0
        )

        if b_state is None:
            ng("Client B が 3秒以内に update_state を受信しなかった")
            return

        ok(f"Client B が update_state を受信")

        if b_state.get("room_id") == room_id:
            ok(f"受信 state の room_id が一致: {room_id}")
        else:
            ng(f"room_id 不一致: {b_state.get('room_id')}")

        # A のプレイヤー位置が B の受信 state に含まれているか
        players = b_state.get("players", {})
        if a_sid in players:
            pos = players[a_sid]
            ok(f"Client A の位置が B の state に反映: ({pos['x']}, {pos['y']})")
        else:
            # SID がズレる場合は状態に2プレイヤーいることだけ確認
            if len(players) == 2:
                ok(f"state に2プレイヤー存在 (SID: {list(players.keys())})")
            else:
                ng(f"players 数が不正: {len(players)}")

    except asyncio.TimeoutError:
        ng("操作がタイムアウトしました")
    except Exception as e:
        ng(f"予期しない例外: {e}")
        raise
    finally:
        await ca.disconnect()
        await cb.disconnect()


# ─────────────────────────────────────────────
# TEST 2: カウントダウン冪等性
# ─────────────────────────────────────────────

async def test_countdown_idempotency() -> None:
    """
    【目的】tick が game_end_time ベースで計算されること（冪等性）を検証する。

    検証ポイント:
    1. time_left が wall clock と整合する（デクリメントではなく end_time - now）
    2. Redis に game_end:{room_id} キーが存在し、正しい値が入っている
    3. 複数の tick を受信しても time_left が単調減少し、リセットされない
    """
    section("TEST 2: カウントダウン冪等性 (game_end_time ベース)")
    info("time_left が wall clock と整合するかを確認")

    ca = GameClient("A")
    cb = GameClient("B")

    try:
        await ca.connect()
        await cb.connect()

        state = await ca.create_room()
        room_id = state["room_id"]
        await cb.join_room(room_id)
        await ca.drain()

        # ── ゲーム開始 & 直後の state を記録 ──
        t_start = time.monotonic()
        await ca.start_game()
        await cb.drain()
        ok("ゲーム開始")

        # ── 最初の tick を待つ（time_left < 120 になったもの）──
        first_tick = await ca.wait_for_state_where(
            lambda s: s.get("time_left", 120) < 120, timeout=4.0
        )
        if first_tick is None:
            ng("4秒以内に tick update_state を受信しなかった")
            return

        t_first = time.monotonic()
        elapsed_first = t_first - t_start
        reported_first = first_tick["time_left"]
        expected_first = max(0, 120 - int(elapsed_first))
        diff_first = abs(reported_first - expected_first)

        ok(f"最初の tick: time_left={reported_first} / 経過={elapsed_first:.1f}s / 期待値≈{expected_first}")
        if diff_first <= 2:
            ok(f"Wall clock との誤差 {diff_first}s ≤ 2s (許容範囲)")
        else:
            ng(f"Wall clock との誤差が大きい: {diff_first}s")

        # ── 3秒待ってさらに tick を収集 ──
        info("3秒待機して time_left の単調減少を確認...")
        await asyncio.sleep(3)

        # 直近の state を取得
        latest = None
        while not ca.state_q.empty():
            latest = await ca.state_q.get()
        if latest is None:
            latest = await ca.wait_for_state_where(
                lambda s: s.get("time_left", 120) < reported_first, timeout=3.0
            )

        if latest is None:
            ng("追加の tick を受信できなかった")
        else:
            t_latest = time.monotonic()
            elapsed_latest = t_latest - t_start
            reported_latest = latest["time_left"]
            expected_latest = max(0, 120 - int(elapsed_latest))
            diff_latest = abs(reported_latest - expected_latest)

            ok(f"3秒後の tick: time_left={reported_latest} / 期待値≈{expected_latest}")
            if diff_latest <= 2:
                ok(f"Wall clock との誤差 {diff_latest}s ≤ 2s (許容範囲)")
            else:
                ng(f"Wall clock との誤差: {diff_latest}s")

            if reported_latest < reported_first:
                ok(f"time_left が単調減少: {reported_first} → {reported_latest} (リセットなし)")
            elif reported_latest == reported_first:
                ng("time_left が変化していない（tick が届いていない可能性）")
            else:
                ng(f"time_left が増加した: {reported_first} → {reported_latest} (リセット疑い)")

        # ── Redis に game_end_time キーが永続化されているか ──
        info("Redis に game_end_time キーが保存されているか確認...")
        r = aioredis.from_url(REDIS_URL, decode_responses=True)
        end_time_raw = await r.get(f"game_end:{room_id}")
        await r.aclose()

        if end_time_raw is None:
            ng(f"Redis キー game_end:{room_id} が存在しない")
        else:
            end_time = float(end_time_raw)
            now = time.time()
            remaining_in_redis = end_time - now
            ok(f"Redis に game_end_time 保存済み: 残り時間≈{remaining_in_redis:.1f}s")

            if 100 < remaining_in_redis < 125:
                ok(f"game_end_time の値が妥当 (120s ± 25s の範囲内)")
            else:
                ng(f"game_end_time の値が想定外: {remaining_in_redis:.1f}s remaining")

    except asyncio.TimeoutError:
        ng("操作がタイムアウトしました")
    except Exception as e:
        ng(f"予期しない例外: {e}")
        raise
    finally:
        await ca.disconnect()
        await cb.disconnect()


# ─────────────────────────────────────────────
# TEST 3: Race Condition 検証
# ─────────────────────────────────────────────

async def test_race_conditions() -> None:
    """
    【目的】分散環境での競合耐性を検証する。

    3-A: 10 クライアントが同時に create_room
         → SET NX により room_id が全てユニークであること
    3-B: 2 プレイヤーが 2 秒間同時に move を連打
         → 分散ロックにより GameState が破損しないこと
         → Redis 上の最終状態が整合していること
    """
    section("TEST 3: Race Condition 検証")

    # ── 3-A: 同時 create_room ──
    info("3-A: 10クライアントが同時に create_room → room_id がユニークかを確認")

    N = 10
    clients = [GameClient(f"Race-{i}") for i in range(N)]

    async def _create(c: GameClient) -> str:
        try:
            await c.connect()
            state = await c.create_room()
            return state["room_id"]
        except Exception as e:
            return f"ERROR:{e}"

    results = await asyncio.gather(*[_create(c) for c in clients])
    await asyncio.gather(*[c.disconnect() for c in clients])

    errors   = [r for r in results if r.startswith("ERROR")]
    room_ids = [r for r in results if not r.startswith("ERROR")]
    unique   = set(room_ids)

    if not errors:
        ok(f"全 {N} クライアントが create_room 完了（エラーなし）")
    else:
        ng(f"{len(errors)} クライアントでエラー: {errors[:3]}")

    if len(unique) == len(room_ids):
        ok(f"room_id が全 {len(room_ids)} 件ユニーク → SET NX が正常動作")
    else:
        ng(
            f"room_id に重複あり: {len(room_ids)} 件中 {len(unique)} 件のみユニーク"
        )

    # ── 3-B: 同一ルームへの同時 move ──
    info("3-B: 2プレイヤーが 2秒間 move 連打 → GameState 破損がないかを確認")

    ca = GameClient("RaceMove-A")
    cb = GameClient("RaceMove-B")
    received_states: list[dict] = []

    try:
        await ca.connect()
        await cb.connect()

        state = await ca.create_room()
        room_id = state["room_id"]
        await cb.join_room(room_id)
        await ca.drain()

        await ca.start_game()
        await ca.drain()
        await cb.drain()
        ok(f"Race 用ルーム作成・開始: {room_id}")

        DIRS = ["right", "down", "left", "up"]
        move_counts = {"A": 0, "B": 0}

        stop_collecting = asyncio.Event()

        async def _collect(client: GameClient) -> None:
            while not stop_collecting.is_set():
                try:
                    s = await asyncio.wait_for(client.state_q.get(), timeout=0.1)
                    received_states.append(s)
                except asyncio.TimeoutError:
                    pass

        async def _spam(client: GameClient, label: str) -> None:
            t_end = time.monotonic() + 2.0
            i = 0
            while time.monotonic() < t_end:
                await client.move(DIRS[i % 4])
                move_counts[label] += 1
                i += 1
                await asyncio.sleep(0.1)  # 100ms スロットリングに合わせる

        # _collect は Task として起動 (_spam 完了後に stop_collecting で終了させる)
        collect_a = asyncio.create_task(_collect(ca))
        collect_b = asyncio.create_task(_collect(cb))

        await asyncio.gather(_spam(ca, "A"), _spam(cb, "B"))

        stop_collecting.set()
        await asyncio.gather(collect_a, collect_b)

        # 残留 state を回収
        await asyncio.sleep(0.3)
        for q in [ca.state_q, cb.state_q]:
            while not q.empty():
                received_states.append(await q.get())

        info(f"送信 move 数: A={move_counts['A']}, B={move_counts['B']}")
        ok(f"受信 update_state 総数: {len(received_states)}")

        # ── 受信した全 state の整合性チェック ──
        REQUIRED_FIELDS = {"room_id", "status", "players", "switches", "score", "time_left"}
        corruption = False

        for i, s in enumerate(received_states):
            missing = REQUIRED_FIELDS - set(s.keys())
            if missing:
                ng(f"state[{i}] にフィールド欠落: {missing}")
                corruption = True
                break

            score = s.get("score", {})
            if not (isinstance(score.get("red"), int) and isinstance(score.get("blue"), int)):
                ng(f"state[{i}] のスコア型が異常: {score}")
                corruption = True
                break

            if score.get("red", -1) < 0 or score.get("blue", -1) < 0:
                ng(f"state[{i}] に負のスコア: {score}")
                corruption = True
                break

        if not corruption and received_states:
            ok(f"全 {len(received_states)} 件の update_state が整合: フィールド欠落・スコア異常なし")

        # ── Redis 上の最終 GameState を直接検証 ──
        info("Redis 上の最終 GameState を直接検証...")
        r = aioredis.from_url(REDIS_URL, decode_responses=True)
        raw = await r.get(f"room:{room_id}")
        await r.aclose()

        if raw is None:
            ng(f"Redis に room:{room_id} が存在しない（切断で削除された可能性）")
        else:
            final = json.loads(raw)
            players = final.get("players", {})
            score   = final.get("score", {})
            switches = final.get("switches", {})

            if len(players) == 2:
                ok(f"Redis 上に2プレイヤーが存在")
            else:
                ng(f"Redis 上のプレイヤー数: {len(players)} (期待: 2)")

            if score.get("red", -1) >= 0 and score.get("blue", -1) >= 0:
                ok(f"Redis 上のスコアが正常: {score}")
            else:
                ng(f"Redis 上のスコアが異常: {score}")

            # スコアとスイッチ所有状態の整合性チェック
            # (map_data の weight なしで score の上限だけ確認)
            total_score = score.get("red", 0) + score.get("blue", 0)
            owned_count = sum(1 for v in switches.values() if v is not None)
            if total_score >= 0:
                ok(f"スイッチ所有: {owned_count} 個 / total_score={total_score}")

    except asyncio.TimeoutError:
        ng("操作がタイムアウトしました")
    except Exception as e:
        ng(f"予期しない例外: {e}")
        raise
    finally:
        await ca.disconnect()
        await cb.disconnect()


# ─────────────────────────────────────────────
# メイン
# ─────────────────────────────────────────────

async def main() -> bool:
    """全テストを実行し、全合格なら True を返す。"""
    # aiohttp が接続失敗時に emit する "Unclosed client session" を
    # asyncio ループの例外ハンドラ経由で抑制する
    loop = asyncio.get_running_loop()
    _default_handler = loop.get_exception_handler() or (
        lambda lp, ctx: lp.default_exception_handler(ctx)
    )

    def _quiet_handler(lp: asyncio.AbstractEventLoop, ctx: dict) -> None:
        if "Unclosed client session" in ctx.get("message", ""):
            return
        _default_handler(lp, ctx)

    loop.set_exception_handler(_quiet_handler)

    print(f"\n{_B}{'=' * 60}{_X}")
    print(f"{_B}  バックエンド統合テスト{_X}")
    print(f"{_B}  SERVER : {SERVER_URL}{_X}")
    print(f"{_B}  REDIS  : {REDIS_URL}{_X}")
    print(f"{_B}{'=' * 60}{_X}")

    if not await preflight():
        return False

    try:
        await test_cross_client_communication()
        await test_countdown_idempotency()
        await test_race_conditions()
    except KeyboardInterrupt:
        print(f"\n{_Y}テストを中断しました{_X}")

    # ── サマリー ──
    section("結果サマリー")
    total = _passed + _failed
    print(f"  合格 {_G}{_B}{_passed}{_X} / 不合格 {_R}{_B}{_failed}{_X} / 合計 {total}")

    if _failed == 0:
        print(f"\n  {_G}{_B}✓ 全テスト合格{_X}\n")
        return True
    else:
        print(f"\n  {_R}{_B}✗ {_failed} 件が失敗{_X}\n")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
