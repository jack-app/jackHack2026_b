import json
from typing import Optional

import redis.asyncio as aioredis

from app.models import GameState, MapData


class RedisStore:
    def __init__(self, url: str) -> None:
        self._client: aioredis.Redis = aioredis.from_url(url, decode_responses=True)

    @property
    def client(self) -> aioredis.Redis:
        return self._client

    # --- GameState ---

    async def create_room_atomic(self, room_id: str, state: GameState) -> bool:
        """NX フラグで原子的に room を作成。成功 (= 新規) なら True を返す。"""
        return bool(
            await self._client.set(f"room:{room_id}", json.dumps(state), nx=True)
        )

    async def save_state(self, room_id: str, state: GameState) -> None:
        await self._client.set(f"room:{room_id}", json.dumps(state))

    async def load_state(self, room_id: str) -> Optional[GameState]:
        raw = await self._client.get(f"room:{room_id}")
        return json.loads(raw) if raw else None

    async def room_exists(self, room_id: str) -> bool:
        return bool(await self._client.exists(f"room:{room_id}"))

    # --- MapData ---

    async def save_map(self, room_id: str, map_data: MapData) -> None:
        await self._client.set(f"map:{room_id}", json.dumps(map_data))

    async def load_map(self, room_id: str) -> Optional[MapData]:
        raw = await self._client.get(f"map:{room_id}")
        return json.loads(raw) if raw else None

    # --- SID ↔ Room ---

    async def set_sid_room(self, sid: str, room_id: str) -> None:
        await self._client.set(f"sid:{sid}", room_id)

    async def get_sid_room(self, sid: str) -> Optional[str]:
        return await self._client.get(f"sid:{sid}")

    async def del_sid_room(self, sid: str) -> None:
        await self._client.delete(f"sid:{sid}")

    # --- Game End Time ---

    async def set_game_end_time(self, room_id: str, end_time: float) -> None:
        await self._client.set(f"game_end:{room_id}", str(end_time))

    async def get_game_end_time(self, room_id: str) -> Optional[float]:
        raw = await self._client.get(f"game_end:{room_id}")
        return float(raw) if raw else None

    # --- Cleanup ---

    async def delete_room(self, room_id: str) -> None:
        await self._client.delete(
            f"room:{room_id}",
            f"map:{room_id}",
            f"game_end:{room_id}",
        )

    # --- Distributed Lock ---

    def lock(
        self,
        room_id: str,
        timeout: float = 5.0,
        blocking_timeout: Optional[float] = None,
    ) -> aioredis.lock.Lock:
        return self._client.lock(
            f"lock:{room_id}",
            timeout=timeout,
            blocking_timeout=blocking_timeout,
        )

    async def close(self) -> None:
        await self._client.aclose()
