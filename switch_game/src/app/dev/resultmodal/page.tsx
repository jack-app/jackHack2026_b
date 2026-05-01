"use client";

import ResultModal from "@/components/UI/ResultModal";
import { GameState } from "@/types/game";

const sampleGameState: GameState = {
  room_id: "ROOM123",
  status: "finished",
  host: "socket-123",
  players: {
    "socket-123": { team: "red", x: 0, y: 0 },
    "socket-456": { team: "blue", x: 4, y: 4 },
  },
  time_left: 0,
  switches: {
    s01: "red",
    s02: "blue",
  },
  score: {
    red: 8,
    blue: 6,
  },
};

export default function DevResultModalPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="mb-6 text-3xl font-semibold">ResultModal Preview</h1>
      <div className="rounded-3xl border border-zinc-700 bg-white/5 p-6">
        <ResultModal gameState={sampleGameState} onReturnToTitle={() => alert("return to title clicked")} />
      </div>
    </main>
  );
}
