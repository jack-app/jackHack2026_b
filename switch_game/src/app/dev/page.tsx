"use client";

import Link from "next/link";

const pages = [
  { href: "/dev/gameframe", label: "GameFrame" },
  { href: "/dev/topheader", label: "TopHeader" },
  { href: "/dev/timeleft", label: "TimeLeft" },
  { href: "/dev/statusdisplay", label: "StatusDisplay" },
  { href: "/dev/scores", label: "Scores" },
  { href: "/dev/board", label: "Board" },
  { href: "/dev/tile", label: "Tile" },
  { href: "/dev/player", label: "Player" },
  { href: "/dev/titlemenu", label: "TitleMenu" },
  { href: "/dev/waitingtext", label: "WaitingText" },
  { href: "/dev/resultmodal", label: "ResultModal" },
];

export default function DevIndex() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-3xl p-8">
        <h1 className="mb-6 text-4xl font-semibold">Component Preview</h1>
        <p className="mb-6 text-zinc-300">Use these pages to render each component in isolation.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {pages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="rounded-lg border border-zinc-700 bg-zinc-900/80 px-5 py-4 text-left transition hover:border-zinc-500"
            >
              <p className="text-lg font-medium">{page.label}</p>
              <p className="text-sm text-zinc-400">{page.href}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
