"use client";

import { GameState } from "@/types/game";

interface ResultModalProps {
  gameState: GameState;
  onReturnToTitle: () => void;
}

export default function ResultModal({
  gameState,
  onReturnToTitle,
}: ResultModalProps) {
  const { red, blue } = gameState.score;
  const winner = red > blue ? "RED" : blue > red ? "BLUE" : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800/50 p-4">
      <div className="bg-gray-800/40 place-self-center text-center outline-double rounded-[20px] pb-3 ">
        <div className="text-bg-10 text-3xl pt-10 mb-5 text-shadow-md text-shadow-slate-300">
          FINAL SCORES
        </div>
        <div className="flex place-content-center gap-5">
          <div className="text-red-600 text-3xl text-shadow-md text-shadow-red-600">
            TEAM RED
            <p className="text-9xl">{red}</p>
          </div>
          <div className="text-blue-500 text-3xl text-shadow-cyan-400 text-shadow-md">
            TEAM BLUE
            <p className="text-9xl">{blue}</p>
          </div>
        </div>
        <p className="animate-pulse text-5xl text-red-500 text-shadow-md text-shadow-red-600 font-bold mt-7 pb-10 px-10">
          {winner === "RED" && "RED TEAM WINS!"}
          {winner === "BLUE" && "BLUE TEAM WINS!"}
          {winner === null && "DRAW!"}
        </p>
        <button
          onClick={onReturnToTitle}
          className="text-white-100 rounded-[40px] border-2 px-3 border-cyan-100/70 text-shadow-md text-blue-red-100"
        >
          ロビーに戻る
        </button>
      </div>
    </div>
  );
}
