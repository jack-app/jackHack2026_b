import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";

type Direction = "up" | "down" | "left" | "right";

const COOLDOWN_MS = 100;

export function useGameInput(socket: Socket | null, enabled: boolean) {
  const lastSentRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      };

      const direction = keyMap[e.key];
      if (!direction || !socket) return;

      const now = Date.now();
      if (now - lastSentRef.current < COOLDOWN_MS) return;

      lastSentRef.current = now;
      socket.emit("move", { direction });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [socket, enabled]);
}
