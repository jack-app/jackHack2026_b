"use client";

import { GameState } from "@/types/game";

interface ResultModalProps {
  gameState: GameState;
  onReturnToTitle: () => void;
}

export default function ResultModal({ gameState, onReturnToTitle }: ResultModalProps) {
  return (
    <div>
      {/* TODO: implement - final scores, win/loss display, return to title button */}
    </div>
  );
}
