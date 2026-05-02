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
        """ユニークな4文字のルームIDを生成する"""
        return "TEST" # 仮のID

    async def create_room(self, sid: str) -> tuple[str, GameState, MapData]:
        """ルームを作成する"""
        raise NotImplementedError("TODO: 未実装")

    async def join_room(self, sid: str, room_id: str) -> tuple[GameState, MapData]:
        """ルームに参加する"""
        raise NotImplementedError("TODO: 未実装")

    async def start_game(self, sid: str, room_id: str) -> GameState:
        """ゲームを開始する"""
        raise NotImplementedError("TODO: 未実装")

    async def move_player(self, sid: str, direction: str) -> tuple[str, GameState] | None:
        """プレイヤーを移動する"""
        return None

    async def tick(self, room_id: str) -> GameState | None:
        """ゲームの状態を更新する（タイマー処理）"""
        return None

    async def disconnect(self, sid: str) -> tuple[str | None, GameState | None]:
        """クライアントが切断したときの処理"""
        return None, None

    def get_room_id(self, sid: str) -> str | None:
        """クライアントが所属するルームIDを取得する"""
        return self._sid_to_room.get(sid)