"use client";

import WaitingText from "@/components/UI/WaitingText";

export default function DevWaitingTextPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="mb-6 text-3xl font-semibold">WaitingText Preview</h1>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-3xl border border-zinc-700 bg-white/5 p-6">
          <p className="mb-4 text-sm text-zinc-400">Host View</p>
          <WaitingText isHost onStartGame={() => alert("start game clicked")} />
        </div>
        <div className="rounded-3xl border border-zinc-700 bg-white/5 p-6">
          <p className="mb-4 text-sm text-zinc-400">Non-host View</p>
          <WaitingText isHost={false} onStartGame={() => alert("start game clicked")} />
        </div>
      </div>
    </main>
  );
}
