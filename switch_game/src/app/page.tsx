"use client";

import { useState, useCallback } from "react";
import { GameState, MapData } from "@/types/game";
import { useSocket } from "@/hooks/useSocket";
import { useGameInput } from "@/hooks/useGameInput";
import TopHeader from "@/components/Layout/TopHeader";
import Board from "@/components/Map/Board";
import TitleMenu from "@/components/UI/TitleMenu";
import WaitingText from "@/components/UI/WaitingText";
import ResultModal from "@/components/UI/ResultModal";

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);

  const handleError = useCallback((reason: string) => {
    alert(reason);
    setGameState(null);
    setMapData(null);
  }, []);

  const { socket, createRoom, joinRoom, startGame } = useSocket(
    setGameState,
    setMapData,
    handleError,
  );

  useGameInput(socket, gameState?.status === "playing");

  const handleReturnToTitle = useCallback(() => {
    setGameState(null);
    setMapData(null);
    socket?.disconnect();
  }, [socket]);

  const socketId = socket?.id;
  const myPlayer = socketId ? gameState?.players[socketId] : undefined;
  const otherPlayers =
    gameState && socketId
      ? Object.entries(gameState.players)
          .filter(([id]) => id !== socketId)
          .map(([, player]) => player)
      : [];

  const showBoard = gameState !== null && mapData !== null && myPlayer !== undefined;

  return (
    <div>
      <TopHeader
        timeLeft={gameState?.time_left ?? null}
        roomId={gameState?.room_id ?? null}
        status={gameState?.status ?? null}
        score={gameState?.score ?? null}
      />

      {/* 状態A: タイトル — 画面中央モーダル */}
      {gameState === null && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
          <TitleMenu onCreateRoom={createRoom} onJoinRoom={joinRoom} />
        </div>
      )}

      {/* 状態B / C / D: ボード (背景) */}
      {showBoard && (
        <Board mapData={mapData!} myPlayer={myPlayer!} otherPlayers={otherPlayers} />
      )}

      {/* 状態B: 待機中オーバーレイ */}
      {gameState?.status === "waiting" && (
        <WaitingText
          isHost={gameState.host === socketId}
          onStartGame={startGame}
        />
      )}

      {/* 状態D: リザルトモーダル */}
      {gameState?.status === "finished" && (
        <ResultModal gameState={gameState} onReturnToTitle={handleReturnToTitle} />
      )}
    </div>
  );
}
