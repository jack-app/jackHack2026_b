import { Player as PlayerType } from "@/types/game";

interface PlayerProps {
  player: PlayerType;
  isSelf: boolean;
}

export default function Player({ player, isSelf }: PlayerProps) {
  return (
    <div className="h-10 w-10 bg-red-950">
      P
    </div>
  );
}
