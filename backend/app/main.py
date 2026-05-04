import asyncio
import os

import orjson
import socketio
from dotenv import load_dotenv
from fastapi import FastAPI

from app.game_manager import GameManager
from app.models import GameError, GameState
from app.redis_store import RedisStore

load_dotenv()

_cors_origins = os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
_redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")

store = RedisStore(_redis_url)


class _OrjsonCodec:
    """Drop-in json replacement for python-socketio using orjson (3-10x faster)."""
    @staticmethod
    def dumps(obj, **kwargs) -> str:
        return orjson.dumps(obj).decode()
    loads = staticmethod(orjson.loads)


# AsyncRedisManager により sio.emit(..., room=X) がワーカーをまたいで届く
mgr = socketio.AsyncRedisManager(_redis_url)

app = FastAPI()
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=_cors_origins,
    client_manager=mgr,
    json=_OrjsonCodec,
)
socket_app = socketio.ASGIApp(sio, app)

gm = GameManager(store)


def _to_client_state(state: GameState) -> dict:
    """item_respawn_queue と PlayerStatus の *_until タイムスタンプを除外してクライアント向けに変換する。"""
    return {
        "room_id": state["room_id"],
        "status": state["status"],
        "host": state["host"],
        "players": {
            sid: {
                "team": p["team"],
                "x": p["x"],
                "y": p["y"],
                "status": {
                    "blinded": p["status"]["blinded"],
                    "reversed": p["status"]["reversed"],
                    "can_jump": p["status"]["can_jump"],
                },
            }
            for sid, p in state["players"].items()
        },
        "items": state["items"],
        "time_left": state["time_left"],
        "switches": state["switches"],
        "score": state["score"],
    }


# Fix 1: tick ループタスクの参照（再起動判定用）
_tick_task: asyncio.Task | None = None


def _ensure_tick_loop() -> None:
    """_tick_loop が動いていなければ起動する。"""
    global _tick_task
    if _tick_task is None or _tick_task.done():
        _tick_task = asyncio.create_task(_tick_loop())


async def _tick_one_room(room_id: str) -> None:
    """Tick a single room. Runs concurrently with other rooms via asyncio.gather."""
    claimed = await store.client.set(f"tick:{room_id}", "1", nx=True, px=900)
    if not claimed:
        return
    try:
        state = await gm.tick(room_id)
    except Exception:
        return
    if state is None:
        await store.remove_playing_room(room_id)
        return
    await sio.emit("update_state", _to_client_state(state), room=room_id)
    if state["status"] == "finished":
        await store.remove_playing_room(room_id)


async def _tick_loop() -> None:
    """
    tick gate (SET NX PX 900) により、同じルームを複数ワーカーが
    同一秒に二重 tick しないことを保証する。

    playing_rooms が空のとき自己停止する。次の start_game で _ensure_tick_loop() が再起動する。
    全ルームは asyncio.gather で並列 tick されるため、逐次処理より wall-clock latency を抑えられる。
    ただし、ループ全体の処理量はアクティブなルーム数に比例する。
    """
    global _tick_task
    while True:
        await asyncio.sleep(1)

        playing_rooms = await store.get_playing_rooms()
        if not playing_rooms:
            _tick_task = None
            return

        await asyncio.gather(*(_tick_one_room(rid) for rid in playing_rooms))


# ── Socket.io イベントハンドラ ──────────────────────────────────────

@sio.event
async def connect(sid: str, environ: dict) -> None:
    # Fix 1: 接続が来た時点で tick ループを起動（クラッシュからの自動回復も兼ねる）
    _ensure_tick_loop()


@sio.event
async def create_room(sid: str, data: dict) -> None:
    room_id, state, map_data = await gm.create_room(sid)
    await sio.enter_room(sid, room_id)
    await sio.emit("map", map_data, to=sid)
    await sio.emit("update_state", _to_client_state(state), to=sid)


@sio.event
async def join_room(sid: str, data: dict) -> None:
    room_id = data.get("room_id", "") if isinstance(data, dict) else ""
    try:
        state, map_data = await gm.join_room(sid, room_id)
    except GameError as e:
        await sio.emit("error", {"reason": e.reason}, to=sid)
        return
    await sio.enter_room(sid, state["room_id"])
    await sio.emit("map", map_data, to=sid)
    await sio.emit("update_state", _to_client_state(state), room=state["room_id"])


@sio.event
async def start_game(sid: str, data: dict) -> None:
    room_id = await gm.get_room_id(sid)
    if room_id is None:
        await sio.emit("error", {"reason": "not_in_room"}, to=sid)
        return
    try:
        state = await gm.start_game(sid, room_id)
    except GameError as e:
        await sio.emit("error", {"reason": e.reason}, to=sid)
        return

    # start_game 内で playing_rooms に追加済み。tick ループが生きていることを確認。
    _ensure_tick_loop()
    await sio.emit("update_state", _to_client_state(state), room=room_id)


@sio.event
async def move(sid: str, data: dict) -> None:
    if not isinstance(data, dict):
        return
    direction = data.get("direction")
    if direction not in ("up", "down", "left", "right"):
        return
    result = await gm.move_player(sid, direction)
    if result is None:
        return

    room_id, state = result
    # tick ループ生存確認（ワーカー再起動後の初回 move で回復）
    if state["status"] == "playing":
        _ensure_tick_loop()
    await sio.emit("update_state", _to_client_state(state), room=room_id)


@sio.event
async def disconnect(sid: str) -> None:
    room_id, state = await gm.disconnect(sid)
    if room_id is None:
        return
    if state:
        await sio.emit("update_state", _to_client_state(state), room=room_id)
    await sio.leave_room(sid, room_id)
