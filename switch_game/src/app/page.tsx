"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { GameState, MapData, ItemData } from "@/types/game";
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

  const gameBgmRef = useRef<HTMLAudioElement | null>(null);
  const titleBgmRef = useRef<HTMLAudioElement | null>(null);
  const prevGameStatusRef = useRef<string | null>(null);
  useEffect(() => {
    const status = gameState?.status ?? null;

    if (status === null) {
      // タイトル画面: タイトル BGM 再生
      if (!titleBgmRef.current) {
        titleBgmRef.current = new Audio(
          "/title-bgm_pocket-bgm_incredible conflict.mp3",
        );
        titleBgmRef.current.loop = true;
      }
      titleBgmRef.current.play().catch(() => {});
    } else {
      titleBgmRef.current?.pause();
      titleBgmRef.current = null;
    }

    if (status === "playing") {
      if (!gameBgmRef.current) {
        gameBgmRef.current = new Audio(
          "/game-bgm_pocket-sound_ハイテク赤ちゃん.mp3",
        );
        gameBgmRef.current.loop = true;
      }
      gameBgmRef.current.play().catch(() => {});
    } else {
      gameBgmRef.current?.pause();
      gameBgmRef.current = null;
    }

    if (prevGameStatusRef.current === "playing" && status === "finished") {
      new Audio("/timeup_pocket-sound_時間切れ（タイムアップ）.mp3")
        .play()
        .catch(() => {});
    }
    prevGameStatusRef.current = status;
  }, [gameState?.status]);

  const handleStartGame = useCallback(() => {
    new Audio("/switch-sound_効果音ラボ_決定ボタンを押す49.mp3")
      .play()
      .catch(() => {});
    startGame();
  }, [startGame]);

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

  const prevItemsRef = useRef<ItemData[]>([]);
  useEffect(() => {
    const items = gameState?.items ?? [];
    const prev = prevItemsRef.current;
    if (myPlayer && prev.length > items.length) {
      const removed = prev.filter(
        (p) => !items.some((c) => c.x === p.x && c.y === p.y),
      );
      const pickedUp = removed.find(
        (item) => item.x === myPlayer.x && item.y === myPlayer.y,
      );
      if (pickedUp) {
        console.log("[item-get]", pickedUp.name, "at", pickedUp.x, pickedUp.y);
        new Audio("/item-get_pocket-sound_アイテム取得音2.mp3")
          .play()
          .catch(() => {});
      }
    }
    prevItemsRef.current = items;
  }, [gameState?.items]);

  const showBoard =
    gameState !== null && mapData !== null && myPlayer !== undefined;

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
        <div className="flex justify-center">
          <Board
            mapData={mapData!}
            myPlayer={myPlayer!}
            otherPlayers={otherPlayers}
            switches={gameState?.switches}
            items={gameState?.items}
            isBlinded={myPlayer?.status?.blinded}
          />

          {/* 状態B: 待機中オーバーレイ */}
          {gameState?.status === "waiting" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <WaitingText
                isHost={gameState.host === socketId}
                onStartGame={handleStartGame}
              />
            </div>
          )}
        </div>
      )}

      {/* 状態D: リザルトモーダル */}
      {gameState?.status === "finished" && (
        <ResultModal
          gameState={gameState}
          onReturnToTitle={handleReturnToTitle}
        />
      )}
    </div>
  );
}
