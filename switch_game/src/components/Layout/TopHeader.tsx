import { GameState } from "@/types/game";

interface TopHeaderProps {
  gameState: GameState | null;
}

export default function TopHeader({ gameState }: TopHeaderProps) {
  return (
    <div>
      {/* TODO: implement - left: TIME LEFT, center: STATUS/ID, right: SCORES */}
    </div>
  );
}
