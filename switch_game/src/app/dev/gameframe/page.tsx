"use client";

import GameFrame from "@/components/Layout/GameFrame";

export default function DevGameFramePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="mb-6 text-3xl font-semibold">GameFrame Preview</h1>
      <div className="bg-white h-1" />
      <GameFrame
        topHeaderProps={{
          timeLeft: 60,
          roomId: "ROOM123",
          status: "playing",
          score: { red: 5, blue: 3 },
        }}
        boardProps={{
          mapData: {
            map: [
              [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,0,1,1,0,"s01",0,1,0,"s02",0,1,1,0,1],
              [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
              [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
              [1,0,"s03",0,0,0,1,0,1,0,0,0,"s04",0,1],
              [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
              [1,0,1,0,0,0,0,"s05",0,0,0,0,1,0,1],
              [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
              [1,0,"s06",0,0,0,1,0,1,0,0,0,"s07",0,1],
              [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
              [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
              [1,0,1,1,0,0,0,1,0,0,0,1,1,0,1],
              [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
              [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
            switch_weights: {
              s01: 2, s02: 3, s03: 2, s04: 3,
              s05: 5, s06: 2, s07: 2,
            },
          },
          myPlayer: { team: "red", x: 1, y: 1 },
          otherPlayers: [
            { team: "red", x: 1, y: 13 },
            { team: "blue", x: 13, y: 1 },
            { team: "blue", x: 13, y: 13 },
          ],
        }}
      />
    </main>
  );
}
