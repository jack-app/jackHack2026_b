import asyncio
import random
import string
from app.models import GameState, MapData, GameError
from app.map_generator import generate_map, get_spawn_position
from app.game_logic import calc_next_pos, is_wall, get_cell, is_switch, calc_score

GAME_DURATION = 120


class GameManager:
    def __init__(self) -> None:
        """初期化"""
        self._rooms: dict[str, GameState] = {}
        self._map_data: dict[str, MapData] = {}
        self._locks: dict[str, asyncio.Lock] = {}
        self._sid_to_room: dict[str, str] = {}

    def _generate_room_id(self) -> str:
        """ユニークなルームIDを生成する"""
        chars = string.ascii_uppercase + string.digits
        while True:
            room_id = "".join(random.choices(chars, k=4))
            if room_id not in self._rooms:
                return room_id

    async def create_room(self, sid: str) -> tuple[str, GameState, MapData]:
        """ルームを作成する"""
        room_id = self._generate_room_id()
        map_data = generate_map()
        x, y = get_spawn_position("red", 0)

        state: GameState = {
            "room_id": room_id,
            "status": "waiting",
            "host": sid,
            "players": {sid: {"team": "red", "x": x, "y": y}},
            "time_left": GAME_DURATION,
            "switches": {switch_id: None for switch_id in map_data["switch_weights"]},
            "score": {"red": 0, "blue": 0},
        }

        self._rooms[room_id] = state
        self._map_data[room_id] = map_data
        self._locks[room_id] = asyncio.Lock()
        self._sid_to_room[sid] = room_id

        return room_id, state, map_data

    async def join_room(self, sid: str, room_id: str) -> tuple[GameState, MapData]:
        """ルームに参加する"""
        lock = self._locks.get(room_id)
        if lock is None:
            raise GameError("room_not_found")

        async with lock:
            state = self._rooms.get(room_id)
            if state is None:
                raise GameError("room_not_found")
            if state["status"] != "waiting":
                raise GameError("room_not_waiting")

            players = state["players"]
            red_count = sum(1 for p in players.values() if p["team"] == "red")
            blue_count = sum(1 for p in players.values() if p["team"] == "blue")
            team = "red" if red_count <= blue_count else "blue"
            team_index = red_count if team == "red" else blue_count
            x, y = get_spawn_position(team, team_index)

            state["players"][sid] = {"team": team, "x": x, "y": y}  # type: ignore[literal-required]
            self._sid_to_room[sid] = room_id

            return state, self._map_data[room_id]

    async def start_game(self, sid: str, room_id: str) -> GameState:
        """ゲームを開始する"""
        lock = self._locks.get(room_id)
        if lock is None:
            raise GameError("room_not_found")

        async with lock:
            state = self._rooms.get(room_id)
            if state is None:
                raise GameError("room_not_found")
            if state["host"] != sid:
                raise GameError("not_host")
            if state["status"] != "waiting":
                raise GameError("game_already_started")
            state["status"] = "playing"

            return state

    async def move_player(self, sid: str, direction: str) -> tuple[str, GameState] | None:
        """プレイヤーを移動する"""
        room_id = self._sid_to_room.get(sid)
        if room_id is None:
            return None

        lock = self._locks.get(room_id)
        if lock is None:
            return None

        async with lock:
            state = self._rooms.get(room_id)
            if state is None or state["status"] != "playing":
                return None

            player = state["players"].get(sid)
            if player is None:
                return None

            map_data = self._map_data[room_id]
            grid = map_data["map"]
            nx, ny = calc_next_pos(player["x"], player["y"], direction)

            if is_wall(grid, nx, ny):
                return None

            player["x"] = nx
            player["y"] = ny

            cell = get_cell(grid, nx, ny)
            if is_switch(cell):
                state["switches"][str(cell)] = player["team"]
                state["score"] = calc_score(state["switches"], map_data["switch_weights"])

            return room_id, state

    async def tick(self, room_id: str) -> GameState | None:
        """ゲームの状態を更新する（タイマー処理）"""
        lock = self._locks.get(room_id)
        if lock is None:
            return None

        async with lock:
            state = self._rooms.get(room_id)
            if state is None or state["status"] != "playing":
                return None

            state["time_left"] -= 1
            if state["time_left"] <= 0:
                state["status"] = "finished"

            return state

    async def disconnect(self, sid: str) -> tuple[str | None, GameState | None]:
        """クライアントが切断したときの処理"""
        room_id = self._sid_to_room.pop(sid, None)
        if room_id is None:
            return None, None

        lock = self._locks.get(room_id)
        if lock is None:
            return room_id, None

        remaining: GameState | None = None

        async with lock:
            state = self._rooms.get(room_id)
            if state is None:
                return room_id, None

            state["players"].pop(sid, None)

            if not state["players"]:
                del self._rooms[room_id]
                del self._map_data[room_id]
                remaining = None
            else:
                remaining = state

        # ロック解放後に Lock 自体を削除する
        if remaining is None:
            self._locks.pop(room_id, None)

        return room_id, remaining

    def get_room_id(self, sid: str) -> str | None:
        """クライアントが所属するルームIDを取得する"""
        return self._sid_to_room.get(sid)
