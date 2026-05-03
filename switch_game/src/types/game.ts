export interface Player {
  team: "red" | "blue";
  x: number;
  y: number;
  status: {
    blinded: boolean;
    reversed: boolean;
    can_jump: boolean;
  };
}

export interface GameState {
  room_id: string;
  status: "waiting" | "playing" | "finished";
  host: string;
  players: Record<string, Player>;
  items: ItemData[];
  time_left: number;
  switches: Record<string, "red" | "blue" | null>;
  score: {
    red: number;
    blue: number;
  };
}

export interface MapData {
  // 0地面、1が壁、2:blined、3: reverse, 4: jump, その他IDはスイッチ
  map: (number | string)[][];
  switch_weights: Record<string, number>;
}

export type ItemType = "reverse" | "blinded" | "jump";

export interface ItemData {
  name: ItemType;
  x: number;
  y: number;
}
