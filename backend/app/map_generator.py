import copy
from typing import Union
from app.models import MapData

# NOTE: 構造はそのまま、中身をよしなに変更してください。
# switch_id -> (x, y, weight)
_SWITCHES: dict[str, tuple[int, int, int]] = {
    "s01": (3, 4, 2),
    "s02": (7, 2, 2),
    "s03": (11, 4, 2),
    "s04": (7, 7, 5),
    "s05": (3, 10, 2),
    "s06": (11, 10, 2),
    "s07": (7, 12, 2),
}

# NOTE: 構造はそのまま、中身をよしなに変更してください。。
# team -> list of (x, y) spawn positions
_SPAWNS: dict[str, list[tuple[int, int]]] = {
    "red":  [(1, 1),  (1, 13)],
    "blue": [(13, 1), (13, 13)],
}

# NOTE: 構造はそのまま、中身をよしなに変更してください。
# 0=床, 1=壁。
# x=列(0-14), y=行(0-14), アクセスは grid[y][x]
_BASE_GRID: list[list[int | str]] = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],  # y=0
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],  # y=1
    [1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1],  # y=2
    [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],  # y=3
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],  # y=4
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],  # y=5
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],  # y=6
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],  # y=7  中央行
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],  # y=8
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],  # y=9
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],  # y=10
    [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],  # y=11
    [1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1],  # y=12
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],  # y=13
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],  # y=14
]

# NOTE: 以下を変えたい場合は、教えてください。
def generate_map() -> MapData:
    grid: list[list[Union[int, str]]] = copy.deepcopy(_BASE_GRID)
    switch_weights: dict[str, int] = {}
    for sid, (x, y, weight) in _SWITCHES.items():
        grid[y][x] = sid
        switch_weights[sid] = weight
    return {"map": grid, "switch_weights": switch_weights}


def get_spawn_position(team: str, index: int) -> tuple[int, int]:
    spawns = _SPAWNS.get(team, [(1, 1)])
    return spawns[index % len(spawns)]
