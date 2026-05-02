import { GameState } from "@/types/game";
import TimeLeft from "./TimeLeft";
import StatusDisplay from "./StatusDisplay";
import Scores from "./Scores";

interface TopHeaderProps {
  gameState: GameState | null;
}

export default function TopHeader({ gameState }: TopHeaderProps) {
  return (
    <div>
      {/* TODO: implement - horizontal HUD bar wrapping the three sub-components */}
      <TimeLeft timeLeft={gameState?.time_left ?? null} />
      <StatusDisplay roomId={gameState?.room_id ?? null} status={gameState?.status ?? null} />
      <Scores score={gameState?.score ?? null} />
    </div>
  );
}
