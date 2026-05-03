import random
import string
import time

import redis.exceptions

from app.game_logic import calc_next_pos, calc_score, get_cell, is_switch, is_wall
from app.map_generator import generate_map, get_spawn_position
from app.models import GameError, GameState, MapData
from app.redis_store import RedisStore

GAME_DURATION = 120


class GameManager:
    def __init__(self, store: RedisStore) -> None:
        self._store = store

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
                "players": {sid: {"team": "red", "x": x, "y": y}},
                "time_left": GAME_DURATION,
                "switches": {sw: None for sw in map_data["switch_weights"]},
                "score": {"red": 0, "blue": 0},
            }
            # Fix 5: room・map・sid を 1 パイプラインで原子的に作成
            if await self._store.create_room_atomic(room_id, state, map_data, sid):
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

            state["players"][sid] = {"team": team, "x": x, "y": y}  # type: ignore[literal-required]
            await self._store.save_state(room_id, state)
            await self._store.set_sid_room(sid, room_id)

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
            # Fix 1: 任意のワーカーの _tick_loop が room を拾えるよう Redis Set に登録
            await self._store.add_playing_room(room_id)
            return state

    # ── move_player ───────────────────────────────────────────

    async def move_player(self, sid: str, direction: str) -> tuple[str, GameState] | None:
        room_id = await self._store.get_sid_room(sid)
        if room_id is None:
            return None

        try:
            # Fix 6: blocking_timeout を削除。lock TTL=5s が安全弁になる。
            # 正当な move をネットワーク遅延・ロック競合で破棄しない。
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

                grid = map_data["map"]
                nx, ny = calc_next_pos(player["x"], player["y"], direction)

                if is_wall(grid, nx, ny):
                    return None

                player["x"] = nx
                player["y"] = ny
                state["players"][sid] = player

                cell = get_cell(grid, nx, ny)
                if is_switch(cell):
                    state["switches"][str(cell)] = player["team"]
                    state["score"] = calc_score(
                        state["switches"], map_data["switch_weights"]
                    )

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

            # Fix (design): デクリメントではなく wall clock から計算するため冪等
            time_left = max(0, int(end_time - time.time()))
            state["time_left"] = time_left
            if time_left <= 0:
                state["status"] = "finished"

            await self._store.save_state(room_id, state)
            return state

    # ── disconnect ────────────────────────────────────────────

    async def disconnect(self, sid: str) -> tuple[str | None, GameState | None]:
        room_id = await self._store.get_sid_room(sid)
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
                # Fix 3: ホストが waiting 中に退室 → 残存プレイヤーの先頭をホストに昇格
                if state["host"] == sid and state["status"] == "waiting":
                    state["host"] = next(iter(state["players"]))
                await self._store.save_state(room_id, state)
                remaining = state

        return room_id, remaining

    # ── get_room_id ───────────────────────────────────────────

    async def get_room_id(self, sid: str) -> str | None:
        return await self._store.get_sid_room(sid)
