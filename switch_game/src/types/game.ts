export interface Player {
  team: "red" | "blue";
  x: number;
  y: number;
}

export interface GameState {
  room_id: string;
  status: "waiting" | "playing" | "finished";
  host: string;
  players: Record<string, Player>;
  time_left: number;
  switches: Record<string, "red" | "blue" | null>;
  score: {
    red: number;
    blue: number;
  };
}

export interface MapData {
  map: (number | string)[][];
  switch_weights: Record<string, number>;
}
