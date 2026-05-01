import { Player as PlayerType } from "@/types/game";

interface PlayerProps {
  player: PlayerType;
  isSelf: boolean;
}

export default function Player({ player, isSelf }: PlayerProps) {
  return (
    <div>
      {/* TODO: implement with CSS transition (transition-all duration-150) */}
    </div>
  );
}
