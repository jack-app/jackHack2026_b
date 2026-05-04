"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { MapData, Player, ItemData } from "@/types/game";
import Tile from "./Tile";
import PlayerComponent from "./Player";
import Item from "./Item";

export interface BoardProps {
  mapData: MapData;
  myPlayer: Player;
  otherPlayers: Player[];
  switches?: Record<string, "red" | "blue" | null>;
  items?: ItemData[];
  isBlinded?: boolean;
}

const HEADER_HEIGHT = 96; // h-24
const MAX_TILE_SIZE = 40;

function useTileSize(rows: number): number {
  const [tileSize, setTileSize] = useState(MAX_TILE_SIZE);

  useEffect(() => {
    function compute() {
      const available = window.innerHeight - HEADER_HEIGHT;
      setTileSize(Math.min(MAX_TILE_SIZE, Math.floor(available / rows)));
    }
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [rows]);

  return tileSize;
}

/**
 * update_state のたびに switches は新規オブジェクトとして届く。
 * 値が変わっていないのに参照が変わると useMemo の deps チェックが毎回 true になるため、
 * 各エントリの値を比較して「実際に変化した時だけ」参照を更新する。
 */
function useStableSwitches(
  switches: Record<string, "red" | "blue" | null> | undefined,
) {
  const ref = useRef(switches);
  if (switches !== ref.current) {
    const prev = ref.current ?? {};
    const curr = switches ?? {};
    if (Object.keys(curr).some((k) => curr[k] !== prev[k])) {
      ref.current = switches;
    }
  }
  return ref.current;
}

export default function Board({
  mapData,
  myPlayer,
  otherPlayers,
  switches,
  items = [],
  isBlinded = false,
}: BoardProps) {
  const tileSize = useTileSize(mapData.map.length);
  const cols = mapData.map[0].length;
  const stableSwitches = useStableSwitches(switches);

  // stableSwitches はスイッチの値が実際に変化した時のみ参照が更新される。
  // プレイヤーが動くだけでは stableSwitches は変わらないため、タイルグリッドの再計算をスキップできる。
  const tileGrid = useMemo(
    () => (
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${cols}, ${tileSize}px)` }}
      >
        {mapData.map.map((row, y) =>
          row.map((cell, x) => {
            const switchId = typeof cell === "string" ? cell : undefined;
            return (
              <Tile
                key={`${x}-${y}`}
                cell={cell}
                size={tileSize}
                switchState={
                  switchId && stableSwitches
                    ? stableSwitches[switchId]
                    : undefined
                }
                switchWeight={
                  switchId ? mapData.switch_weights[switchId] : undefined
                }
              />
            );
          }),
        )}
      </div>
    ),
    [mapData, tileSize, stableSwitches, cols],
  );

  return (
    <div className="relative inline-block">
      {/* タイルグリッド（背景） */}
      {tileGrid}

      {/* アイテム */}
      {items.map((item, i) => (
        <div
          key={`item-${i}`}
          className="absolute pointer-events-none flex items-center justify-center"
          style={{
            left: item.x * tileSize,
            top: item.y * tileSize,
            width: tileSize,
            height: tileSize,
          }}
        >
          <Item type={item.name} />
        </div>
      ))}

      {/* 他プレイヤー（薄く表示） */}
      {otherPlayers.map((player, i) => (
        <div
          key={`other-${i}`}
          className="absolute transition-all duration-150 pointer-events-none flex items-center justify-center opacity-50"
          style={{
            left: player.x * tileSize,
            top: player.y * tileSize,
            width: tileSize,
            height: tileSize,
          }}
        >
          <PlayerComponent player={player} />
        </div>
      ))}

      {/* 自分のプレイヤー（濃く表示） */}
      <div
        className="absolute transition-all duration-150 pointer-events-none flex items-center justify-center"
        style={{
          left: myPlayer.x * tileSize,
          top: myPlayer.y * tileSize,
          width: tileSize,
          height: tileSize,
        }}
      >
        <PlayerComponent player={myPlayer} />
      </div>

      {/* フォグオーバーレイ: 自分の周囲2マス以外を黒で覆う */}
      {isBlinded && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${myPlayer.x * tileSize + tileSize / 2}px ${myPlayer.y * tileSize + tileSize / 2}px, transparent 60px, rgba(0,0,0,0.97) 100px)`,
          }}
        />
      )}
    </div>
  );
}
