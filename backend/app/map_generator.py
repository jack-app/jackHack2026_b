import random
import copy
from typing import Union, Dict, List, Tuple, cast
from collections import deque
from app.models import MapData

class _MapGenerator:
    """
    マップ、スイッチ、スポーン地点を生成するクラス。
    """
    def __init__(self, width: int = 21, height: int = 11, wall_ratio: float = 0.3, switch_ratio: float = 0.09):
        self.width = width   # マップの横幅(x軸)
        self.height = height # マップの縦幅(y軸)
        self.wall_ratio = wall_ratio # マップに対する壁の割合
        self.switch_ratio = switch_ratio # マップに対するスイッチの割合
        
        # 内部状態の初期化
        self.map_data = [] # マップの地形（壁=1, 床=0）を2次元配列で保持
        self.switches_dict = {} # 各スイッチの座標(x, y)と獲得点数を保持
        # (x, y) 形式で定義
        self.red_spawns = [(1, 1), (1, self.height - 2), (1, self.height // 2)]
        self.blue_spawns = [(self.width - 2, self.height - 2), (self.width - 2, 1), (self.width - 2, self.height - 1 - (self.height // 2))]
        self.safe_zones = self._calculate_safe_zones()

    def _calculate_safe_zones(self) -> set:
        """壁を置いてはいけないスポーン地点周辺の座標を計算"""
        zones = set()
        for sx, sy in self.red_spawns + self.blue_spawns:
            for dy, dx in [(0, 0), (0, 1), (0, -1), (1, 0), (-1, 0)]:
                zones.add((sy + dy, sx + dx))
        return zones

    def generate(self) -> Tuple[List[List[int]], Dict, Dict]:
        """
        マップ生成のメインフローを実行します。
        戻り値: (base_grid, switches_dict, spawns_dict)
        """
        self._initialize_empty_map()
        self._place_walls()
        self._place_switches()
        
        spawns_dict = {
            "red": self.red_spawns,
            "blue": self.blue_spawns
        }
        return self.map_data, self.switches_dict, spawns_dict

    def _initialize_empty_map(self):
        """外枠（壁）のみを持つ空のグリッドを作成"""
        self.map_data = [[0 for _ in range(self.width)] for _ in range(self.height)]
        # 上下の壁
        for x in range(self.width):
            self.map_data[0][x] = 1      
            self.map_data[self.height - 1][x] = 1    
            
        # 左右の壁
        for y in range(self.height):
            self.map_data[y][0] = 1
            self.map_data[y][self.width - 1] = 1

    def _place_walls(self):
        """指定された割合まで、点対称かつ連結性を維持して壁を配置"""
        num_walls = int(self.width * self.height * self.wall_ratio) 
        placed_walls = 0
        attempts = 0
        
        while placed_walls < num_walls and attempts < 1000:
            attempts += 1
            y = random.randint(1, self.height - 2)
            x = random.randint(1, self.width // 2) 
            sym_y, sym_x = self.height - 1 - y, self.width - 1 - x
            
            if self.map_data[y][x] == 1 or (y, x) in self.safe_zones or (sym_y, sym_x) in self.safe_zones:
                continue
            
            # 仮置き
            self.map_data[y][x] = self.map_data[sym_y][sym_x] = 1
            
            if (self._is_2x2_clean(y, x) and 
                self._is_2x2_clean(sym_y, sym_x) and 
                self._is_fully_connected()):
                placed_walls += 1 if (y, x) == (sym_y, sym_x) else 2
            else:
                # 無効な配置なら戻す
                self.map_data[y][x] = self.map_data[sym_y][sym_x] = 0

    def _is_2x2_clean(self, y: int, x: int) -> bool:
        """(y, x) 周辺に 2x2 の壁ブロックができていないか確認"""
        for dy, dx in [(0, 0), (0, -1), (-1, 0), (-1, -1)]:
            ny, nx = y + dy, x + dx
            if ny < 0 or ny + 1 >= self.height or nx < 0 or nx + 1 >= self.width:
                continue
            if (self.map_data[ny][nx] == 1 and self.map_data[ny][nx + 1] == 1 and
                self.map_data[ny + 1][nx] == 1 and self.map_data[ny + 1][nx + 1] == 1):
                return False
        return True

    def _is_fully_connected(self) -> bool:
        """すべての床(0)が連結しているかBFSで確認"""
        floor_count = sum(row.count(0) for row in self.map_data)
        if floor_count == 0: return True
        
        # 最初の床を探す
        start_node = None
        for r in range(self.height):
            for c in range(self.width):
                if self.map_data[r][c] == 0:
                    start_node = (r, c)
                    break
            if start_node: break
            
        if start_node is None:
            return True
        
        visited = {start_node}
        queue = deque([start_node])
        reachable_count = 1
        
        while queue:
            cy, cx = queue.popleft()
            for dy, dx in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
                ny, nx = cy + dy, cx + dx
                if (0 <= ny < self.height and 0 <= nx < self.width and 
                    self.map_data[ny][nx] == 0 and (ny, nx) not in visited):
                    visited.add((ny, nx))
                    queue.append((ny, nx))
                    reachable_count += 1
        return reachable_count == floor_count

    def _place_switches(self):
        """点対称にスイッチを配置"""
        switch_num = int(self.width * self.height * self.switch_ratio) 
        if self.width % 2 == 0 or self.height % 2 == 0:
            # 縦横のどちらかが偶数の場合、中央マスが存在しないため強制的に偶数個にする
            if switch_num % 2 != 0:
                switch_num -= 1
        else:
            # 縦横ともに奇数の場合は、中央マスが存在するため奇数個（中央に1つ配置）にする
            if switch_num % 2 == 0:
                switch_num -= 1

        self.switches_dict = {}
        valid_coords = []
        for r in range(1, self.height - 1):
            for c in range(1, self.width - 1):
                if (self.map_data[r][c] == 0 and 
                    (c, r) not in self.red_spawns and 
                    (c, r) not in self.blue_spawns):
                    valid_coords.append((r, c))

        counter = 1

        # 中央スイッチの配置
        if switch_num % 2 != 0:
            center_y = self.height // 2
            center_x = self.width // 2
            if (center_y, center_x) in valid_coords:
                sid = f"s{counter:02}"
                self.switches_dict[sid] = (center_x, center_y, 1) # (x, y, weight)
                counter += 1
                switch_num -= 1
                valid_coords.remove((center_y, center_x))

        attempts = 0
        while switch_num > 0 and len(valid_coords) >= 2 and attempts < 1000:
            attempts += 1
            y, x = random.choice(valid_coords)
            sy, sx = self.height - 1 - y, self.width - 1 - x 
            
            if (sy, sx) in valid_coords and (y, x) != (sy, sx):
                if abs(y - sy) <= 1 and abs(x - sx) <= 1: continue
                if self._has_adjacent_switch(y, x): continue

                score = 1 # 点数を1で固定 
                
                # ペアで配置
                for pos_y, pos_x in [(y, x), (sy, sx)]:
                    sid = f"s{counter:02}"
                    self.switches_dict[sid] = (pos_x, pos_y, score)
                    counter += 1
                    valid_coords.remove((pos_y, pos_x))
                
                switch_num -= 2

    def _has_adjacent_switch(self, y: int, x: int) -> bool:
        """指定座標の周囲1マスに既にスイッチがあるか確認"""
        for sid, (sx, sy, _) in self.switches_dict.items():
            if abs(sy - y) <= 1 and abs(sx - x) <= 1:
                return True
        return False


# デフォルト設定での生成器
_default_generator = _MapGenerator(width=21, height=11)
_BASE_GRID, _SWITCHES, _SPAWNS = _default_generator.generate()


# NOTE: 以下を変えたい場合は、教えてください。
def generate_map() -> MapData:
    grid: list[list[Union[int, str]]] = cast(
        list[list[Union[int, str]]], 
        copy.deepcopy(_BASE_GRID)
    )
    switch_weights: dict[str, int] = {}
    for sid, (x, y, weight) in _SWITCHES.items():
        grid[y][x] = sid
        switch_weights[sid] = weight
    return {"map": grid, "switch_weights": switch_weights}


def get_spawn_position(team: str, index: int) -> tuple[int, int]:
    spawns = _SPAWNS.get(team, [(1, 1)])
    return spawns[index % len(spawns)]
