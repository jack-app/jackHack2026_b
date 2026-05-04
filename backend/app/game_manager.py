import random
import string
import time
from typing import Union

import redis.exceptions

from app.game_logic import (
    calc_next_pos,
    calc_score,
    get_cell,
    is_out_of_bounds,
    is_switch,
    is_wall,
    reverse_direction,
)
from app.map_generator import generate_map, get_initial_items, get_spawn_position
from app.models import GameError, GameState, Item, ItemRespawn, MapData, PlayerStatus
from app.redis_store import RedisStore

GAME_DURATION = 60
EFFECT_DURATION = 10.0   # seconds
ITEM_RESPAWN_DELAY = 20.0  # seconds


def _make_status() -> PlayerStatus:
    return {
        "blinded": False, "reversed": False, "can_jump": False,
        "blinded_until": None, "reversed_until": None, "can_jump_until": None,
    }


def _expire_player_effects(status: PlayerStatus, now: float) -> None:
    """期限切れのエフェクトを解除する（move_player / tick の両方から呼ぶ）。"""
    if status.get("blinded") and status.get("blinded_until") is not None and now >= status["blinded_until"]:
        status["blinded"] = False
        status["blinded_until"] = None
    if status.get("reversed") and status.get("reversed_until") is not None and now >= status["reversed_until"]:
        status["reversed"] = False
        status["reversed_until"] = None
    if status.get("can_jump") and status.get("can_jump_until") is not None and now >= status["can_jump_until"]:
        status["can_jump"] = False
        status["can_jump_until"] = None


class GameManager:
    def __init__(self, store: RedisStore) -> None:
        self._store = store
        # Map data is immutable after creation — cache it in-process to avoid Redis GETs on every move.
        self._map_cache: dict[str, MapData] = {}
        # sid → room_id is immutable per session; cache in-process to skip Redis GET on every move.
        # Socket.io pins each socket to one worker, so this is safe in multi-worker deployments.
        self._sid_room_cache: dict[str, str] = {}

    # ── create_room ───────────────────────────────────────────

    async def create_room(self, sid: str) -> tuple[str, GameState, MapData]:
        map_data = generate_map()
        x, y = get_spawn_position("red", 0)
        chars = string.ascii_uppercase + string.digits

        while True:
            room_id = "".join(random.choices(chars, k=4))
            state: GameState = {
                "room_id": room_id,
                "status": "waiting",
                "host": sid,
                "players": {sid: {"team": "red", "x": x, "y": y, "status": _make_status()}},
                "items": get_initial_items(map_data),
                "item_respawn_queue": [],
                "time_left": GAME_DURATION,
                "switches": {sw: None for sw in map_data["switch_weights"]},
                "score": {"red": 0, "blue": 0},
            }
            if await self._store.create_room_atomic(room_id, state, map_data, sid):
                self._map_cache[room_id] = map_data
                self._sid_room_cache[sid] = room_id
                break

        return room_id, state, map_data

    # ── join_room ─────────────────────────────────────────────

    async def join_room(self, sid: str, room_id: str) -> tuple[GameState, MapData]:
        if not await self._store.room_exists(room_id):
            raise GameError("room_not_found")

        async with self._store.lock(room_id):
            state = await self._store.load_state(room_id)
            if state is None:
                raise GameError("room_not_found")
            if state["status"] != "waiting":
                raise GameError("room_not_waiting")

            players = state["players"]
            red_count = sum(1 for p in players.values() if p["team"] == "red")
            blue_count = sum(1 for p in players.values() if p["team"] == "blue")
            team: str = "red" if red_count <= blue_count else "blue"
            team_index = red_count if team == "red" else blue_count
            x, y = get_spawn_position(team, team_index)

            state["players"][sid] = {  # type: ignore[literal-required]
                "team": team, "x": x, "y": y, "status": _make_status()
            }
            await self._store.save_state(room_id, state)
            await self._store.set_sid_room(sid, room_id)
            self._sid_room_cache[sid] = room_id

            map_data = await self._store.load_map(room_id)
            if map_data is None:
                raise GameError("room_not_found")
            return state, map_data

    # ── start_game ────────────────────────────────────────────

    async def start_game(self, sid: str, room_id: str) -> GameState:
        if not await self._store.room_exists(room_id):
            raise GameError("room_not_found")

        async with self._store.lock(room_id):
            state = await self._store.load_state(room_id)
            if state is None:
                raise GameError("room_not_found")
            if state["host"] != sid:
                raise GameError("not_host")
            if state["status"] != "waiting":
                raise GameError("game_already_started")

            state["status"] = "playing"
            await self._store.set_game_end_time(room_id, time.time() + GAME_DURATION)
            await self._store.save_state(room_id, state)
            await self._store.add_playing_room(room_id)
            return state

    # ── move_player ───────────────────────────────────────────

    async def move_player(self, sid: str, direction: str) -> tuple[str, GameState] | None:
        room_id = self._sid_room_cache.get(sid) or await self._store.get_sid_room(sid)
        if room_id is None:
            return None

        try:
            async with self._store.lock(room_id, timeout=5.0):
                state = await self._store.load_state(room_id)
                if state is None or state["status"] != "playing":
                    return None

                player = state["players"].get(sid)
                if player is None:
                    return None

                map_data = await self._store.load_map(room_id)
                if map_data is None:
                    return None

                now = time.time()
                status = player["status"]
                _expire_player_effects(status, now)

                # reversed なら入力方向を反転
                effective_dir = reverse_direction(direction) if status["reversed"] else direction
                nx, ny = calc_next_pos(player["x"], player["y"], effective_dir)

                grid = map_data["map"]
                if status["can_jump"]:
                    if is_out_of_bounds(grid, nx, ny):
                        return None
                else:
                    if is_wall(grid, nx, ny):
                        return None

                player["x"] = nx
                player["y"] = ny
                state["players"][sid] = player

                cell = get_cell(grid, nx, ny)
                if is_switch(cell):
                    state["switches"][str(cell)] = player["team"]
                    state["score"] = calc_score(state["switches"], map_data["switch_weights"])

                # アイテム踏み込み判定
                picked_idx = next(
                    (i for i, it in enumerate(state["items"]) if it["x"] == nx and it["y"] == ny),
                    None,
                )
                if picked_idx is not None:
                    picked: Item = state["items"].pop(picked_idx)
                    self._apply_item(state, sid, player["team"], picked["name"], now)
                    state["item_respawn_queue"].append({
                        "name": picked["name"],
                        "respawn_at": now + ITEM_RESPAWN_DELAY,
                    })

                await self._store.save_state(room_id, state)
                return room_id, state

        except (redis.exceptions.LockError, redis.exceptions.RedisError):
            return None

    # ── tick ──────────────────────────────────────────────────

    async def tick(self, room_id: str) -> GameState | None:
        async with self._store.lock(room_id, blocking_timeout=0.5):
            state = await self._store.load_state(room_id)
            if state is None or state["status"] != "playing":
                return None

            end_time = await self._store.get_game_end_time(room_id)
            if end_time is None:
                return None

            now = time.time()
            time_left = max(0, int(end_time - now))
            state["time_left"] = time_left
            if time_left <= 0:
                state["status"] = "finished"

            # エフェクト期限切れチェック
            for player in state["players"].values():
                _expire_player_effects(player["status"], now)

            # アイテムリスポーンチェック
            still_waiting: list[ItemRespawn] = []
            respawning: list[ItemRespawn] = []
            for pending in state["item_respawn_queue"]:
                if now >= pending["respawn_at"]:
                    respawning.append(pending)
                else:
                    still_waiting.append(pending)

            if respawning:
                map_data = await self._store.load_map(room_id)
                if map_data is not None:
                    self._map_cache[room_id] = map_data
                else:
                    self._map_cache.pop(room_id, None)
                if map_data is None:
                    # マップ取得失敗 → 次 tick で再試行
                    still_waiting.extend(respawning)
                else:
                    for item_pending in respawning:
                        pos = self._find_item_spawn_position(
                            map_data["map"], state["items"], state["players"]
                        )
                        if pos:
                            state["items"].append(
                                Item(name=item_pending["name"], x=pos[0], y=pos[1])
                            )
                        else:
                            # 有効なスポーン位置なし → 5秒後に再試行
                            retry: ItemRespawn = {
                                "name": item_pending["name"],
                                "respawn_at": now + 5.0,
                            }
                            still_waiting.append(retry)

            state["item_respawn_queue"] = still_waiting

            await self._store.save_state(room_id, state)
            return state

    # ── disconnect ────────────────────────────────────────────

    async def disconnect(self, sid: str) -> tuple[str | None, GameState | None]:
        room_id = self._sid_room_cache.pop(sid, None) or await self._store.get_sid_room(sid)
        await self._store.del_sid_room(sid)

        if room_id is None:
            return None, None

        if not await self._store.room_exists(room_id):
            return room_id, None

        remaining: GameState | None = None

        async with self._store.lock(room_id):
            state = await self._store.load_state(room_id)
            if state is None:
                return room_id, None

            state["players"].pop(sid, None)

            if not state["players"]:
                await self._store.delete_room(room_id)
                remaining = None
            else:
                if state["host"] == sid and state["status"] == "waiting":
                    state["host"] = next(iter(state["players"]))
                await self._store.save_state(room_id, state)
                remaining = state

        return room_id, remaining

    # ── get_room_id ───────────────────────────────────────────

    async def get_room_id(self, sid: str) -> str | None:
        return self._sid_room_cache.get(sid) or await self._store.get_sid_room(sid)

    # ── helpers ───────────────────────────────────────────────

    @staticmethod
    def _apply_item(state: GameState, sid: str, my_team: str, item_name: str, now: float) -> None:
        """アイテム効果を適用する。"""
        effect_until = now + EFFECT_DURATION
        opponent_team = "blue" if my_team == "red" else "red"

        if item_name == "jump":
            s = state["players"][sid]["status"]
            s["can_jump"] = True
            s["can_jump_until"] = effect_until

        elif item_name in ("blind", "reverse"):
            for other_sid, other_player in state["players"].items():
                if other_player["team"] == opponent_team:
                    s = state["players"][other_sid]["status"]
                    if item_name == "blind":
                        s["blinded"] = True
                        s["blinded_until"] = effect_until
                    else:
                        s["reversed"] = True
                        s["reversed_until"] = effect_until

    @staticmethod
    def _find_item_spawn_position(
        grid: list[list[Union[int, str]]],
        active_items: list[Item],
        players: dict,
    ) -> tuple[int, int] | None:
        """リスポーン用の空き床タイルをランダムに返す。"""
        occupied = {(it["x"], it["y"]) for it in active_items}
        occupied |= {(p["x"], p["y"]) for p in players.values()}

        height = len(grid)
        width = len(grid[0]) if height > 0 else 0
        valid = [
            (x, y)
            for y in range(1, height - 1)
            for x in range(1, width - 1)
            if grid[y][x] == 0 and (x, y) not in occupied
        ]
        return random.choice(valid) if valid else None
