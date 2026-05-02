from typing import TypedDict, Dict, List, Optional, Union, Literal


class Player(TypedDict):
    team: Literal["red", "blue"]
    x: int
    y: int


class GameState(TypedDict):
    room_id: str
    status: Literal["waiting", "playing", "finished"]
    host: str
    players: Dict[str, Player]
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
