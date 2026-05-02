import { GameState } from "@/types/game";

interface StatusDisplayProps {
  roomId: string | null;
  status: GameState["status"] | null;
}

export default function StatusDisplay({ roomId, status }: StatusDisplayProps) {
  return (
    <div>
      {/* TODO: implement - center HUD: room ID and game status label */}
    </div>
  );
}
