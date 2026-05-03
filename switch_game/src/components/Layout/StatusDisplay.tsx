import { GameState } from "@/types/game";

export interface StatusDisplayProps {
  roomId: string | null;
  status: GameState["status"] | null;
}

export default function StatusDisplay({ roomId, status }: StatusDisplayProps) {
  let status_display;

  if (status == "waiting"){
    status_display = "WAITING"
  }else if(status == "playing"){
    status_display = "PLAYING"
  }else if(status == "finished"){
    status_display = "FINISHED"
  }else{
    status_display = "MAIN MENU"
  }
  const glowClass = "tracking-widest text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.7)]";
  return (
    <div className="flex flex-col items-center py-4">
      {status != null && (
      <div className={glowClass}>GAME ID: {roomId}</div>
      )}
      <div className={glowClass}>STATUS: {status_display}</div>
    </div>
  );
}
