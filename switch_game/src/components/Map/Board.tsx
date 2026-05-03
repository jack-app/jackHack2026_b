import { MapData, Player } from "@/types/game";
import Tile from "./Tile";
import PlayerComponent from "./Player";

export interface BoardProps {
  mapData: MapData;
  myPlayer: Player;
  otherPlayers: Player[];
  switches?: Record<string, "red" | "blue" | null>;
}

const TILE_SIZE = 40;

export default function Board({
  mapData,
  myPlayer,
  otherPlayers,
  switches,
}: BoardProps) {
  const cols = mapData.map[0].length;

  return (
    <div className="relative inline-block">
      {/* タイルグリッド（背景） */}
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${cols}, ${TILE_SIZE}px)` }}
      >
        {mapData.map.map((row, y) =>
          row.map((cell, x) => {
            const switchId = typeof cell === "string" ? cell : undefined;
            return (
              <Tile
                key={`${x}-${y}`}
                cell={cell}
                switchState={
                  switchId && switches ? switches[switchId] : undefined
                }
                switchWeight={
                  switchId ? mapData.switch_weights[switchId] : undefined
                }
              />
            );
          }),
        )}
      </div>

      {/* 他プレイヤー（薄く表示） */}
      {otherPlayers.map((player, i) => (
        <div
          key={`other-${i}`}
          className="absolute transition-all duration-150 pointer-events-none flex items-center justify-center"
          style={{
            left: player.x * TILE_SIZE,
            top: player.y * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
          }}
        >
          <PlayerComponent player={player} isSelf={false} />
        </div>
      ))}

      {/* 自分のプレイヤー（濃く表示） */}
      <div
        className="absolute transition-all duration-150 pointer-events-none flex items-center justify-center"
        style={{
          left: myPlayer.x * TILE_SIZE,
          top: myPlayer.y * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE,
        }}
      >
        <PlayerComponent player={myPlayer} isSelf={true} />
      </div>
    </div>
  );
}
