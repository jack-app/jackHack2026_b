import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { GameState, MapData } from "@/types/game";

interface UseSocketReturn {
  socket: Socket | null;
  createRoom: () => void;
  joinRoom: (roomId: string) => void;
  startGame: () => void;
}

export function useSocket(
  onGameState: (state: GameState) => void,
  onMapData: (data: MapData) => void,
  onError: (reason: string) => void,
): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // TODO: implement
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const createRoom = () => {
    // TODO: implement
  };

  const joinRoom = (_roomId: string) => {
    // TODO: implement
  };

  const startGame = () => {
    // TODO: implement
  };

  return { socket: socketRef.current, createRoom, joinRoom, startGame };
}
