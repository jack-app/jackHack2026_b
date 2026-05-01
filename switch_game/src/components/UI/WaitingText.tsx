"use client";

interface WaitingTextProps {
  isHost: boolean;
  onStartGame: () => void;
}

export default function WaitingText({ isHost, onStartGame }: WaitingTextProps) {
  return (
    <div>
      {/* TODO: implement - waiting message, start button (host only) */}
    </div>
  );
}
