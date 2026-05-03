"use client";

import Player from "@/components/Map/Player";

export default function DevPlayerPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="mb-6 text-3xl font-semibold">Player Preview</h1>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-3xl border border-zinc-700 bg-white/5 p-6">
          <p className="mb-4 text-sm text-zinc-400">Self Player</p>
          <Player player={{ team: "red", x: 2, y: 3 }} isBlined />
        </div>
        <div className="rounded-3xl border border-zinc-700 bg-white/5 p-6">
          <p className="mb-4 text-sm text-zinc-400">Other Player</p>
          <Player player={{ team: "blue", x: 1, y: 4 }}isBlined={false}  />
        </div>
      </div>
    </main>
  );
}
