"use client";

import StatusDisplay from "@/components/Layout/StatusDisplay";

export default function DevStatusDisplayPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="mb-6 text-3xl font-semibold">StatusDisplay Preview</h1>
      <div className="mb-4 rounded-3xl border border-zinc-700 bg-white/5 p-6">
        <p className="mb-2 text-sm text-zinc-400">waiting</p>
        <StatusDisplay roomId="ROOM123" status="waiting" />
      </div>
      <div className="mb-4 rounded-3xl border border-zinc-700 bg-white/5 p-6">
        <p className="mb-2 text-sm text-zinc-400">playing</p>
        <StatusDisplay roomId="ROOM123" status="playing" />
      </div>
      <div className="mb-4 rounded-3xl border border-zinc-700 bg-white/5 p-6">
        <p className="mb-2 text-sm text-zinc-400">finished</p>
        <StatusDisplay roomId="ROOM123" status="finished" />
      </div>
      <div className="rounded-3xl border border-zinc-700 bg-white/5 p-6">
        <p className="mb-2 text-sm text-zinc-400">null / title screen</p>
        <StatusDisplay roomId={null} status={null} />
      </div>
    </main>
  );
}
