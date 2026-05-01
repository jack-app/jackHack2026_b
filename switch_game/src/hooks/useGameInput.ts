import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";

type Direction = "up" | "down" | "left" | "right";

export function useGameInput(socket: Socket | null, enabled: boolean) {
  const lastSentRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (_e: KeyboardEvent) => {
      // TODO: implement with 100ms throttle
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [socket, enabled]);
}
