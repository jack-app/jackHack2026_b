"use client";

import TitleMenu from "@/components/UI/TitleMenu";

export default function DevTitleMenuPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="mb-6 text-3xl font-semibold">TitleMenu Preview</h1>
      <div className="rounded-3xl border border-zinc-700 bg-white/5 p-6">
        <TitleMenu
          onCreateRoom={() => {
            alert("create room clicked");
          }}
          onJoinRoom={(roomId) => {
            alert(`join room: ${roomId}`);
          }}
        />
      </div>
    </main>
  );
}
