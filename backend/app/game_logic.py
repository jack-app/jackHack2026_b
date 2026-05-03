from typing import Union, Optional, Literal

_REVERSE_DIR: dict[str, str] = {
    "up": "down", "down": "up", "left": "right", "right": "left",
}


def reverse_direction(direction: str) -> str:
    return _REVERSE_DIR.get(direction, direction)


def calc_next_pos(x: int, y: int, direction: str) -> tuple[int, int]:
    if direction == "up":
        return x, y - 1
    if direction == "down":
        return x, y + 1
    if direction == "left":
        return x - 1, y
    if direction == "right":
        return x + 1, y
    return (x, y)


def get_cell(grid: list[list[Union[int, str]]], x: int, y: int) -> Union[int, str]:
    if is_out_of_bounds(grid, x, y):
        return 1  # 境界外は壁として扱う
    return grid[y][x]


def is_out_of_bounds(grid: list[list[Union[int, str]]], x: int, y: int) -> bool:
    return y < 0 or y >= len(grid) or x < 0 or x >= (len(grid[0]) if grid else 0)


def is_wall(grid: list[list[Union[int, str]]], x: int, y: int) -> bool:
    return get_cell(grid, x, y) == 1


def is_switch(cell: Union[int, str]) -> bool:
    return isinstance(cell, str)


def calc_score(
    switches: dict[str, Optional[Literal["red", "blue"]]],
    switch_weights: dict[str, int],
) -> dict[str, int]:
    score: dict[str, int] = {"red": 0, "blue": 0}
    for switch_id, owner in switches.items():
        if owner in score:
            score[owner] += switch_weights.get(switch_id, 0)
    return score
