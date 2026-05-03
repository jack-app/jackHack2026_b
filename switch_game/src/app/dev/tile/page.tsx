"use client";

import Tile from "@/components/Map/Tile";

export default function DevTilePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="mb-6 text-3xl font-semibold">Tile Preview</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-zinc-700 bg-white/5 p-6">
          <p className="mb-3 text-sm text-zinc-400">Wall</p>
          <Tile cell={0} />
        </div>
        <div className="rounded-3xl border border-zinc-700 bg-white/5 p-6">
          <p className="mb-3 text-sm text-zinc-400">Floor</p>
          <Tile cell={1} />
        </div>
        <div className="rounded-3xl border border-zinc-700 bg-white/5 p-6">
          <p className="mb-3 text-sm text-zinc-400">Switch</p>
          <Tile cell="s01" switchState="red" switchWeight={5} />
        </div>
                <div className="rounded-3xl border border-zinc-700 bg-white/5 p-6">
          <p className="mb-3 text-sm text-zinc-400">Switch</p>
          <Tile cell="s01" switchState="red" switchWeight={5} />
        </div>
                <div className="rounded-3xl border border-zinc-700 bg-white/5 p-6">
          <p className="mb-3 text-sm text-zinc-400">Switch</p>
          <Tile cell="s01" switchState="blue" switchWeight={5} />
        </div>
                <div className="rounded-3xl border border-zinc-700 bg-white/5 p-6">
          <p className="mb-3 text-sm text-zinc-400">Switch</p>
          <Tile cell="s01" switchState={null} switchWeight={5} />
        </div>
      </div>
    </main>
  );
}
