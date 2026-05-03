from typing import TypedDict, Dict, List, Optional, Union, Literal


class PlayerStatus(TypedDict):
    blinded: bool
    reversed: bool
    can_jump: bool
    blinded_until: Optional[float]   # unix timestamp; None = inactive
    reversed_until: Optional[float]
    can_jump_until: Optional[float]


class Player(TypedDict):
    team: Literal["red", "blue"]
    x: int
    y: int
    status: PlayerStatus


class Item(TypedDict):
    name: Literal["blind", "reverse", "jump"]
    x: int
    y: int


class ItemRespawn(TypedDict):
    name: Literal["blind", "reverse", "jump"]
    respawn_at: float  # unix timestamp


class GameState(TypedDict):
    room_id: str
    status: Literal["waiting", "playing", "finished"]
    host: str
    players: Dict[str, Player]
    items: List[Item]
    item_respawn_queue: List[ItemRespawn]
    time_left: int
    switches: Dict[str, Optional[Literal["red", "blue"]]]
    score: Dict[str, int]


class MapData(TypedDict):
    map: List[List[Union[int, str]]]
    switch_weights: Dict[str, int]


class GameError(Exception):
    def __init__(self, reason: str) -> None:
        self.reason = reason
        super().__init__(reason)
