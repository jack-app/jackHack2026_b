"use client";

import TopHeader from "@/components/Layout/TopHeader";
import { GameState } from "@/types/game";

const sampleGameState: GameState = {
  room_id: "ROOM123",
  status: "playing",
  host: "socket-123",
  players: {
    "socket-123": { team: "red", x: 1, y: 2 },
    "socket-456": { team: "blue", x: 3, y: 4 },
  },
  time_left: 74,
  switches: {
    s01: "red",
    s02: "blue",
  },
  score: {
    red: 5,
    blue: 3,
  },
};

export default function DevTopHeaderPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="mb-6 text-3xl font-semibold">TopHeader Preview</h1>
      <div className="rounded-3xl border border-zinc-700 bg-white/5 p-6">
        <TopHeader timeLeft={sampleGameState.time_left} roomId={sampleGameState.room_id} status={sampleGameState.status} score={sampleGameState.score} />
      </div>
    </main>
  );
}
