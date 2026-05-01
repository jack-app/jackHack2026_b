"use client";

import GameFrame from "@/components/Layout/GameFrame";

export default function DevGameFramePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="mb-6 text-3xl font-semibold">GameFrame Preview</h1>
      <GameFrame>
        <div className="rounded-xl border border-zinc-600 bg-white/5 p-8 text-zinc-100">
          GameFrame children content
        </div>
      </GameFrame>
    </main>
  );
}
