"use client";

import Scores from "@/components/Layout/Scores";

export default function DevScoresPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="mb-6 text-3xl font-semibold">Scores Preview</h1>
      <div className="mb-4 rounded-3xl border border-zinc-700 bg-white/5 p-6">
        <p className="mb-2 text-sm text-zinc-400">with scores</p>
        <Scores score={{ red: 5, blue: 3 }} />
      </div>
      <div className="rounded-3xl border border-zinc-700 bg-white/5 p-6">
        <p className="mb-2 text-sm text-zinc-400">null (hidden)</p>
        <Scores score={null} />
      </div>
    </main>
  );
}
