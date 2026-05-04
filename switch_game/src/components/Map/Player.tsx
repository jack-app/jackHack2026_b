import { Player as PlayerType } from "@/types/game";

interface PlayerProps {
  player: PlayerType;
}

export default function Player({ player }: PlayerProps) {
  const { blinded, reversed, can_jump } = player.status;
  const bgClass = player.team === "red" ? "bg-red-500" : "bg-blue-500";

  const ringStyle = can_jump
    ? { boxShadow: "0 0 0 2px #4ade80, 0 0 8px #4ade80" }   // 緑リング
    : reversed
    ? { boxShadow: "0 0 0 2px #c084fc, 0 0 8px #c084fc" }   // 紫リング
    : {};

  return (
    <div className="relative">
      <div className={`w-9 h-9 rounded-full ${bgClass} relative`} style={ringStyle}>
        {/* 左の目 */}
        <div className="relative top-3 left-2.5">
          <div className="w-1.5 h-2.5 rounded-[50%/50%] bg-black absolute"></div>
          <div className="w-0.5 h-1 rounded-[100%/100%] bg-white absolute top-0 left-0.5"></div>
        </div>
        {/* 右の目 */}
        <div className="absolute top-3 left-5">
          <div className="w-1.5 h-2.5 rounded-[50%/50%] bg-black absolute"></div>
          <div className="w-0.5 h-1 rounded-[50%/50%] bg-white absolute top-0 left-0.5"></div>
        </div>
        {/* 目隠しバンド: blinded */}
        {blinded && (
          <div className="absolute top-2.5 left-0 w-full h-3 bg-black opacity-80 rounded" />
        )}
      </div>

      {/* reversed: 上部に ↔ アイコン */}
      {reversed && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-black text-purple-400 leading-none">
          ↔
        </div>
      )}
      {/* can_jump: 上部に ↑ アイコン */}
      {can_jump && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-black text-green-400 leading-none">
          ↑↑
        </div>
      )}
    </div>
  );
}
