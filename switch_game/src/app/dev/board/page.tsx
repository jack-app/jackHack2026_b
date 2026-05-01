"use client";

import Board from "@/components/Map/Board";
import { GameState, MapData } from "@/types/game";

const sampleMapData: MapData = {
  map: [
    [0, 1, "s01", 1, 0],
    [1, 1, 1, "s02", 1],
    [0, 1, 0, 1, 0],
    [1, "s03", 1, 1, 1],
  ],
  switch_weights: {
    s01: 5,
    s02: 3,
    s03: 2,
  },
};

const sampleGameState: GameState = {
  room_id: "ROOM123",
  status: "waiting",
  host: "socket-123",
  players: {
    "socket-123": { team: "red", x: 1, y: 1 },
    "socket-456": { team: "blue", x: 3, y: 2 },
  },
  time_left: 120,
  switches: {
    s01: "red",
    s02: "blue",
    s03: null,
  },
  score: {
    red: 2,
    blue: 1,
  },
};

export default function DevBoardPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="mb-6 text-3xl font-semibold">Board Preview</h1>
      <div className="rounded-3xl border border-zinc-700 bg-white/5 p-6">
        <Board mapData={sampleMapData} gameState={sampleGameState} socketId="socket-123" />
      </div>
    </main>
  );
}
