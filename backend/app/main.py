import asyncio
import os

import socketio
from dotenv import load_dotenv
from fastapi import FastAPI

from app.game_manager import GameManager
from app.models import GameError
from app.redis_store import RedisStore

load_dotenv()

_cors_origins = os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
_redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")

store = RedisStore(_redis_url)

# AsyncRedisManager により sio.emit(..., room=X) がワーカーをまたいで届く
mgr = socketio.AsyncRedisManager(_redis_url)

app = FastAPI()
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=_cors_origins,
    client_manager=mgr,
)
socket_app = socketio.ASGIApp(sio, app)

gm = GameManager(store)

# このワーカーが tick を担当するルームの集合
_worker_rooms: set[str] = set()
# tick ループタスクの参照（再起動判定用）
_tick_task: asyncio.Task | None = None


def _ensure_tick_loop() -> None:
    """_tick_loop が動いていなければ起動する。"""
    global _tick_task
    if _tick_task is None or _tick_task.done():
        _tick_task = asyncio.create_task(_tick_loop())


async def _tick_loop() -> None:
    """
    1 秒ごとに _worker_rooms 内の各ルームを tick する。
    tick gate (SET NX PX 900) により、同じルームを複数ワーカーが
    同一秒に二重 tick しないことを保証する。
    """
    while True:
        await asyncio.sleep(1)
        if not _worker_rooms:
            break

        for room_id in list(_worker_rooms):
            # このワーカーが今秒の tick 権を取得できた場合のみ処理する
            claimed = await store.client.set(
                f"tick:{room_id}", "1", nx=True, px=900
            )
            if not claimed:
                continue

            state = await gm.tick(room_id)
            if state is None:
                _worker_rooms.discard(room_id)
                continue

            await sio.emit("update_state", state, room=room_id)
            if state["status"] == "finished":
                _worker_rooms.discard(room_id)


# ------------------------------------------------------------------
# Socket.io イベントハンドラ
# ------------------------------------------------------------------

@sio.event
async def connect(sid: str, environ: dict) -> None:
    pass


@sio.event
async def create_room(sid: str, data: dict) -> None:
    room_id, state, map_data = await gm.create_room(sid)
    await sio.enter_room(sid, room_id)
    await sio.emit("map", map_data, to=sid)
    await sio.emit("update_state", state, to=sid)


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
    await sio.emit("update_state", state, room=state["room_id"])


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

    # このワーカーが start_game を受け取った = tick 担当として登録
    _worker_rooms.add(room_id)
    _ensure_tick_loop()

    await sio.emit("update_state", state, room=room_id)


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

    # start_game を別ワーカーが受け取った場合でも、move を受け取った
    # ワーカーが tick を引き継げるようにする（ワーカークラッシュ耐性）
    if state["status"] == "playing" and room_id not in _worker_rooms:
        _worker_rooms.add(room_id)
        _ensure_tick_loop()

    await sio.emit("update_state", state, room=room_id)


@sio.event
async def disconnect(sid: str) -> None:
    room_id, state = await gm.disconnect(sid)
    if room_id is None:
        return
    if state:
        await sio.emit("update_state", state, room=room_id)
    await sio.leave_room(sid, room_id)
