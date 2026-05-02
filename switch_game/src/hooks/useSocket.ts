import { useCallback, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { GameState, MapData } from "@/types/game";

interface UseSocketReturn {
  socket: Socket | null;
  createRoom: () => void;
  joinRoom: (roomId: string) => void;
  startGame: () => void;
  move: (direction: "up" | "down" | "left" | "right") => void;
  disconnect: () => void;
}

export function useSocket(
  onGameState: (state: GameState) => void,
  onMapData: (data: MapData) => void,
  onError: (reason: string) => void,
): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const onGameStateRef = useRef(onGameState);
  const onMapDataRef = useRef(onMapData);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onGameStateRef.current = onGameState;
    onMapDataRef.current = onMapData;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000", {
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("update_state", (state: GameState) => {
      onGameStateRef.current(state);
    });
    socket.on("map", (data: MapData) => {
      onMapDataRef.current(data);
    });
    socket.on("error", ({ reason }: { reason: string }) => {
      onErrorRef.current(reason);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const createRoom = useCallback(() => {
    socketRef.current?.emit("create_room", {});
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    socketRef.current?.emit("join_room", { room_id: roomId });
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit("start_game", {});
  }, []);

  const move = useCallback((direction: "up" | "down" | "left" | "right") => {
    socketRef.current?.emit("move", { direction });
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  return { socket: socketRef.current, createRoom, joinRoom, startGame, move, disconnect };
}
