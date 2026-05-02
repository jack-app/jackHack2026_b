import asyncio
import socketio
from fastapi import FastAPI
from app.game_manager import GameManager
from app.models import GameError

app = FastAPI()
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
socket_app = socketio.ASGIApp(sio, app)

gm = GameManager()
_countdown_tasks: dict[str, asyncio.Task] = {}

# ゲームのカウントダウンを管理する非同期関数
async def _run_countdown(room_id: str) -> None:
    try:
        while True:
            await asyncio.sleep(1)
            state = await gm.tick(room_id)
            if state is None:
                break
            await sio.emit("update_state", state, room=room_id)
            if state["status"] == "finished":
                break
    finally:
        _countdown_tasks.pop(room_id, None)

# クライアントが接続したときのイベントハンドラー
@sio.event
async def connect(sid: str, environ: dict) -> None:
    pass

# クライアントがルームを作成するイベントハンドラー
@sio.event
async def create_room(sid: str, data: dict) -> None:
    room_id, state, map_data = await gm.create_room(sid)
    await sio.enter_room(sid, room_id)
    await sio.emit("map", map_data, to=sid)
    await sio.emit("update_state", state, to=sid)

# クライアントがルームに参加するイベントハンドラー
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

# クライアントがゲームを開始するイベントハンドラー
@sio.event
async def start_game(sid: str, data: dict) -> None:
    room_id = gm.get_room_id(sid)
    if room_id is None:
        await sio.emit("error", {"reason": "not_in_room"}, to=sid)
        return
    try:
        state = await gm.start_game(sid, room_id)
    except GameError as e:
        await sio.emit("error", {"reason": e.reason}, to=sid)
        return
    task = asyncio.create_task(_run_countdown(room_id))
    _countdown_tasks[room_id] = task
    await sio.emit("update_state", state, room=room_id)

# クライアントがプレイヤーを移動するイベントハンドラー
@sio.event
async def move(sid: str, data: dict) -> None:
    if not isinstance(data, dict):
        return
    direction = data.get("direction")
    if direction not in ("up", "down", "left", "right"):
        return
    result = await gm.move_player(sid, direction)
    if result:
        room_id, state = result
        await sio.emit("update_state", state, room=room_id)

# クライアントが切断したときのイベントハンドラー
@sio.event
async def disconnect(sid: str) -> None:
    room_id, state = await gm.disconnect(sid)
    if room_id is None:
        return
    task = _countdown_tasks.pop(room_id, None)
    if task:
        task.cancel()
    if state:
        await sio.emit("update_state", state, room=room_id)
    await sio.leave_room(sid, room_id)
