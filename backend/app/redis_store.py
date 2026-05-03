import json
from typing import Optional

import redis.asyncio as aioredis

from app.models import GameState, MapData

# Fix 4: orphaned key 対策。ゲーム最長時間(120s) + 十分なバッファを確保
ROOM_TTL = 3600   # 1 hour - ルーム状態・game_end_time
MAP_TTL  = 7200   # 2 hours - マップデータ（不変だが安全のため長め）
SID_TTL  = 3600   # 1 hour - sid→room_id セッションマッピング


class RedisStore:
    def __init__(self, url: str) -> None:
        self._client: aioredis.Redis = aioredis.from_url(url, decode_responses=True)

    @property
    def client(self) -> aioredis.Redis:
        return self._client

    # ── GameState ──────────────────────────────────────────────

    async def create_room_atomic(
        self,
        room_id: str,
        state: GameState,
        map_data: MapData,
        sid: str,
    ) -> bool:
        """Fix 5: room・map・sid を原子的に作成する。
        room_id が衝突した場合は False を返し、他のキーは書き込まない。
        """
        # SET NX で room_id の唯一性を保証
        room_set = await self._client.set(
            f"room:{room_id}", json.dumps(state), nx=True, ex=ROOM_TTL
        )
        if not room_set:
            return False

        # 成功したら map と sid をパイプラインで一括書き込み
        # (transaction=False: MULTI/EXEC を使わず RTT を 1 回に圧縮)
        async with self._client.pipeline(transaction=False) as pipe:
            pipe.set(f"map:{room_id}", json.dumps(map_data), ex=MAP_TTL)
            pipe.set(f"sid:{sid}", room_id, ex=SID_TTL)
            await pipe.execute()

        return True

    async def save_state(self, room_id: str, state: GameState) -> None:
        await self._client.set(
            f"room:{room_id}", json.dumps(state), ex=ROOM_TTL
        )

    async def load_state(self, room_id: str) -> Optional[GameState]:
        raw = await self._client.get(f"room:{room_id}")
        return json.loads(raw) if raw else None

    async def room_exists(self, room_id: str) -> bool:
        return bool(await self._client.exists(f"room:{room_id}"))

    # ── MapData ────────────────────────────────────────────────

    async def save_map(self, room_id: str, map_data: MapData) -> None:
        await self._client.set(
            f"map:{room_id}", json.dumps(map_data), ex=MAP_TTL
        )

    async def load_map(self, room_id: str) -> Optional[MapData]:
        raw = await self._client.get(f"map:{room_id}")
        return json.loads(raw) if raw else None

    # ── SID ↔ Room ────────────────────────────────────────────

    async def set_sid_room(self, sid: str, room_id: str) -> None:
        await self._client.set(f"sid:{sid}", room_id, ex=SID_TTL)

    async def get_sid_room(self, sid: str) -> Optional[str]:
        return await self._client.get(f"sid:{sid}")

    async def del_sid_room(self, sid: str) -> None:
        await self._client.delete(f"sid:{sid}")

    # ── Game End Time ─────────────────────────────────────────

    async def set_game_end_time(self, room_id: str, end_time: float) -> None:
        await self._client.set(
            f"game_end:{room_id}", str(end_time), ex=ROOM_TTL
        )

    async def get_game_end_time(self, room_id: str) -> Optional[float]:
        raw = await self._client.get(f"game_end:{room_id}")
        return float(raw) if raw else None

    # ── Playing Rooms Set (Fix 1) ─────────────────────────────

    async def add_playing_room(self, room_id: str) -> None:
        """ゲーム開始時に呼ぶ。任意のワーカーの _tick_loop が拾えるようになる。"""
        await self._client.sadd("playing_rooms", room_id)

    async def remove_playing_room(self, room_id: str) -> None:
        await self._client.srem("playing_rooms", room_id)

    async def get_playing_rooms(self) -> set[str]:
        return await self._client.smembers("playing_rooms")

    # ── Cleanup ───────────────────────────────────────────────

    async def delete_room(self, room_id: str) -> None:
        async with self._client.pipeline(transaction=False) as pipe:
            pipe.delete(
                f"room:{room_id}",
                f"map:{room_id}",
                f"game_end:{room_id}",
            )
            pipe.srem("playing_rooms", room_id)
            await pipe.execute()

    # ── Distributed Lock ──────────────────────────────────────

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
