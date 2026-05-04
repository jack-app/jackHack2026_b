"use client";

import Item from "@/components/Map/Item";

export default function DevItemPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="mb-6 text-3xl font-semibold">Item Preview</h1>
      <div className="grid gap-4 sm:grid-cols-3 items-center justify-center">
        <div className="flex flex-col items-center rounded-3xl border border-zinc-700 bg-white/5 p-6">
          <p className="mb-3 text-sm text-zinc-400">Reverse</p>
          <Item type="reverse" />
        </div>
        <div className="flex flex-col items-center rounded-3xl border border-zinc-700 bg-white/5 p-6">
          <p className="mb-3 text-sm text-zinc-400">Blinded</p>
          <Item type="blinded" />
        </div>
        <div className="flex flex-col items-center rounded-3xl border border-zinc-700 bg-white/5 p-6">
          <p className="mb-3 text-sm">Jump</p>
          <Item type="jump" />
        </div>
      </div>
    </main>
  );
}
