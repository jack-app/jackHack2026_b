import { GameState } from "@/types/game";
import TimeLeft from "./TimeLeft";
import StatusDisplay from "./StatusDisplay";
import Scores from "./Scores";

export interface TopHeaderProps {
  timeLeft: GameState["time_left"] | null;
  roomId: GameState["room_id"] | null;
  status: GameState["status"] | null;
  score: GameState["score"] | null;
}

export default function TopHeader({ timeLeft, roomId, status, score }: TopHeaderProps) {
  return (
    <div>
      {/* TODO: implement - horizontal HUD bar wrapping the three sub-components */}
      <TimeLeft timeLeft={timeLeft} />
      <StatusDisplay roomId={roomId} status={status} />
      <Scores score={score} />
    </div>
  );
}
