"use client";

import Board from "@/components/Map/Board";
import { MapData, Player } from "@/types/game";

const sampleMapData: MapData = {
  map: [
    [0, 1, "s01", 1, 0],
    [1, 1, 1, "s02", 1],
    [0, 1, 0, 1, 0],
    [1, "s03", 1, 1, 1],
  ],
  switch_weights: {
    s01: 5,
    s02: 3,
    s03: 2,
  },
};

const myPlayer: Player = {
  team: "red",
  x: 1,
  y: 1,
  status: {
    blinded: false,
    reversed: false,
    can_jump: false,
  },
};

const otherPlayers: Player[] = [
  {
    team: "blue",
    x: 3,
    y: 0,
    status: {
      blinded: false,
      reversed: false,
      can_jump: false,
    },
  },
  {
    team: "red",
    x: 0,
    y: 3,
    status: {
      blinded: false,
      reversed: false,
      can_jump: false,
    },
  },
];

export default function DevBoardPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="mb-6 text-3xl font-semibold">Board Preview</h1>
      <div className="rounded-3xl border border-zinc-700 bg-white/5 p-6">
        <Board
          mapData={sampleMapData}
          myPlayer={myPlayer}
          otherPlayers={otherPlayers}
          switches={{ s01: "red", s02: "blue", s03: null }}
          isBlinded={false}
        />
      </div>
    </main>
  );
}
