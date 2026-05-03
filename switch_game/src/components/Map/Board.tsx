import { MapData, Player } from "@/types/game";

export interface BoardProps {
  mapData: MapData;
  myPlayer: Player;
  otherPlayers: Player[];
}

export default function Board(_props?: BoardProps) {
  return (
    <div>
      {/* TODO: implement grid rendering */}
    </div>
  );
}
