import random
import copy
from typing import Union
from collections import deque
from app.models import MapData

def _generate_initial_data(size: int = 15):
    """
    モジュール読み込み時に1度だけ実行され、完全に対称なマップデータを生成します。
    戻り値: (base_grid, switches_dict, spawns_dict)
    """
    # [0は床、1は壁] のみを持つ純粋なマップ配列を作成
    map_data = [[0 for _ in range(size)] for _ in range(size)]
    for i in range(size):
        map_data[0][i] = 1      
        map_data[size-1][i] = 1    
        map_data[i][0] = 1
        map_data[i][size-1] = 1

    # (x, y) 形式でスポーン地点を定義
    # Redは左端、Blueは右端で、点対称になるように設定
    red_spawns = [(1, 1), (1, size - 2), (1, size // 2)]
    blue_spawns = [(size - 2, size - 2), (size - 2, 1), (size - 2, size // 2)]
    
    # 壁を置いてはいけないセーフゾーンの設定
    safe_zones = set()
    for sx, sy in red_spawns + blue_spawns:
        for dy, dx in [(0, 0), (0, 1), (0, -1), (1, 0), (-1, 0)]:
            safe_zones.add((sy + dy, sx + dx))

    # --- 判定用関数 ---
    def creates_2x2_block(y, x):
        for dy, dx in [(0, 0), (0, -1), (-1, 0), (-1, -1)]:
            if y + dy < 0 or y + dy + 1 >= size or x + dx < 0 or x + dx + 1 >= size: continue
            if (map_data[y + dy][x + dx] == 1 and map_data[y + dy][x + dx + 1] == 1 and
                map_data[y + dy + 1][x + dx] == 1 and map_data[y + dy + 1][x + dx + 1] == 1):
                return True
        return False

    def is_fully_connected():
        floor_count = 0
        start_node = None
        for r in range(size):
            for c in range(size):
                if map_data[r][c] == 0:
                    floor_count += 1
                    if start_node is None: start_node = (r, c)
        if floor_count == 0: return True
        
        visited = set([start_node])
        queue = deque([start_node])
        reachable_count = 1
        
        while queue:
            cy, cx = queue.popleft()
            for dy, dx in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
                ny, nx = cy + dy, cx + dx
                if map_data[ny][nx] == 0 and (ny, nx) not in visited:
                    visited.add((ny, nx))
                    queue.append((ny, nx))
                    reachable_count += 1
        return reachable_count == floor_count

    # --- 壁の配置 (点対称) ---
    wall_ratio = 0.2 
    num_walls = int(size * size * wall_ratio) 
    placed_walls = 0
    attempts = 0
    while placed_walls < num_walls and attempts < 1000:
        attempts += 1
        y = random.randint(1, size - 2)
        x = random.randint(1, size // 2) 
        sym_y, sym_x = size - 1 - y, size - 1 - x
        
        if map_data[y][x] == 1 or map_data[sym_y][sym_x] == 1: continue
        if (y, x) in safe_zones or (sym_y, sym_x) in safe_zones: continue
        
        map_data[y][x] = map_data[sym_y][sym_x] = 1
        
        if creates_2x2_block(y, x) or creates_2x2_block(sym_y, sym_x) or not is_fully_connected():
            map_data[y][x] = map_data[sym_y][sym_x] = 0
        else:
            placed_walls += 1 if (y, x) == (sym_y, sym_x) else 2

    # --- スイッチの配置 (点対称) ---
    swtich_set_ratio = 0.05 
    switch_num = int(size * size * swtich_set_ratio) 

    # サイズが奇数のため、スイッチ総数が偶数の場合は奇数個に調整して中央争奪戦を作る
    if switch_num % 2 == 0:
        switch_num -= 1

    switches_dict = {}
    valid_coords = []
    
    # スポーン地点以外の空きマスをリストアップ
    for r in range(1, size - 1):
        for c in range(1, size - 1):
            if map_data[r][c] == 0 and (c, r) not in red_spawns and (c, r) not in blue_spawns:
                valid_coords.append((r, c)) # (y, x) の順で格納

    def has_adjacent_switch(check_y, check_x):
        # 置かれたスイッチの辞書をチェック
        for sid, (sx, sy, weight) in switches_dict.items():
            if abs(sy - check_y) <= 1 and abs(sx - check_x) <= 1:
                return True
        return False

    switch_id_counter = 1
    
    # 奇数個の特権、中央に高得点スイッチを配置
    if switch_num % 2 != 0:
        center = size // 2
        if map_data[center][center] == 0 and not has_adjacent_switch(center, center):
            sid = f"s{switch_id_counter:02}"
            switches_dict[sid] = (center, center, 5) # (x, y, weight) の形式[cite: 4]
            switch_id_counter += 1
            switch_num -= 1
            valid_coords.remove((center, center))

    switch_attempts = 0 
    
    while switch_num > 0 and len(valid_coords) >= 2 and switch_attempts < 1000:
        switch_attempts += 1
        y, x = random.choice(valid_coords)
        sym_y, sym_x = size - 1 - y, size - 1 - x 
        
        if (y, x) in valid_coords and (sym_y, sym_x) in valid_coords and (y, x) != (sym_y, sym_x):
            if abs(y - sym_y) <= 1 and abs(x - sym_x) <= 1:
                continue
            if has_adjacent_switch(y, x) or has_adjacent_switch(sym_y, sym_x):
                continue

            score = random.randint(1, 3) 
            
            # 片方の配置
            s_id1 = f"s{switch_id_counter:02}"
            switches_dict[s_id1] = (x, y, score)
            switch_id_counter += 1
            valid_coords.remove((y, x))
            
            # もう片方（対称位置）の配置[cite: 4]
            s_id2 = f"s{switch_id_counter:02}"
            switches_dict[s_id2] = (sym_x, sym_y, score)
            switch_id_counter += 1
            valid_coords.remove((sym_y, sym_x))
            
            switch_num -= 2

    spawns_dict = {
        "red": red_spawns,
        "blue": blue_spawns
    }
    
    return map_data, switches_dict, spawns_dict

# 2. 定数の初期化
_BASE_GRID, _SWITCHES, _SPAWNS = _generate_initial_data(15)


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
