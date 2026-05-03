import { Player as PlayerType } from "@/types/game";

interface PlayerProps {
  player: PlayerType;
  isSelf: boolean;
}

export default function Player({ player, isSelf }: PlayerProps) {

  // 赤チームの場合
  if (player.team === "red")return (
    <div>
      <div className="w-9 h-9 rounded-full bg-red-500 relative">
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
      </div>
    </div>
    
  );
  // 青チームの場合
  if (player.team === "blue")return (
    <div>
      <div className="w-9 h-9 rounded-full bg-blue-500 relative">
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
      </div>
    </div>
  );
}
