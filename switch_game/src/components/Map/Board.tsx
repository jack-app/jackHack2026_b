import { GameState, MapData } from "@/types/game";

interface BoardProps {
  mapData: MapData;
  gameState: GameState;
  socketId: string | undefined;
}

export default function Board({ mapData, gameState, socketId }: BoardProps) {
  return (
    <div>
      {/* TODO: implement grid rendering */}
    </div>
  );
}
