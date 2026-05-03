"use client";

interface WaitingTextProps {
  isHost: boolean;
  onStartGame: () => void;
}

export default function WaitingText({ isHost, onStartGame }: WaitingTextProps) {
  return (
    <div>
      {/* TODO: implement - waiting message, start button (host only) */}
      Waiting for other players...
      {isHost && (
        <button onClick={onStartGame} className="ml-4 px-4 py-2 bg-blue-500 text-white rounded">
          Start Game
        </button>
      )}
    </div>
  );
}
