import { GameState } from "@/types/game";
import TimeLeft from "./TimeLeft";
import StatusDisplay from "./StatusDisplay";
import Scores from "./Scores";

interface TopHeaderProps {
  gameState: GameState | null;
}

/*export default function TopHeader({ gameState }: TopHeaderProps) {
  return (
    
    <div className="flex items-center justify-between px-8 py-1 border-2 rounded-md">
      
      {/* TODO: implement - horizontal HUD bar wrapping the three sub-components }
      <div className="text-left pt-5  scale-170 ">
      <TimeLeft timeLeft={gameState?.time_left ?? null} />
      </div>
      <div className="text-center scale-150 pl-10 pb-10">
      <StatusDisplay roomId={gameState?.room_id ?? null} status={gameState?.status ?? null} />
      </div>
      <div className="text-right pt-10 ">
        <Scores score={gameState?.score ?? null} />
      </div>
    </div> 

    
  );
}*/

export default function TopHeader({ gameState }: TopHeaderProps) {
  return (
    // 全体を包むコンテナ（余計な border-2 は外して画像に近づけます）
    <div className="flex items-center justify-between w-full bg-black h-24 overflow-hidden border-b border-white/20">
      
      {/* 左側：台形セクション */}
      <div className="relative h-full flex-1 min-w-[320px]">
        {/* 台形の外枠（白いラインを出すための背面） */}
        <div 
          className="absolute inset-0 bg-white/40" 
          style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }}
        />
        {/* 台形の内側（メインの背景色） */}
        <div 
          className="absolute inset-[1px] inset-r-0 bg-zinc-900 flex flex-col justify-center pl-8 pr-16"
          style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }}
        >
          {/* ラベル */}
          <span className="text-[10px] text-zinc-400 tracking-widest font-mono">TIME LEFT</span>
          
          <div className="flex items-center gap-4">
            {/* ここに TimeLeft を入れる！ scale は台形の中で調整 */}
            <div className=" text-white scale-120
            ">
              <TimeLeft timeLeft={gameState?.time_left ?? null} />
            </div>
            
          </div>
        </div>
      </div>
{/* 中央：STATUS DISPLAY (逆台形) */}
<div className="relative flex-[1.5] h-full flex items-center justify-center -mx-6">
          {/* 上下の白い境界線 (左右の台形を繋ぐ) */}
          <div className="absolute top-0 w-full h-[1px] bg-white/30"></div>
          <div className="absolute bottom-0 w-full h-[1px] bg-white/30"></div>
          {/* うっすらとした背景装飾 */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>

          {/* コンテンツ本体：はみ出しを直すため、余計な padding を削除 */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            {/* pb-10 を pl-10 に、scale-150 を維持したまま中央に配置 */}
            <div className="text-center scale-150 pl-10">
 <StatusDisplay roomId={gameState?.room_id ?? null} status={gameState?.status ?? null} />
            </div>

          </div>
        </div>

      {/* 右側：スコア */}
      <div className="relative h-full flex-1 min-w-[320px]">
        {/* 台形の外枠：左側を斜めにする (15% 0 から開始) */}
        <div 
          className="absolute inset-0 bg-white/40" 
          style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)' }} 
        />
        {/* 台形の内側 */}
        <div 
          className="absolute inset-[1px] inset-l-0 bg-zinc-900 flex flex-col justify-center pr-8 pl-16 items-end"
          style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)' }}
        >
          <span className="text-[5px] text-zinc-400 tracking-widest mb-1"></span>
          
          {/* ここに Scores を配置 */}
          <div className=" origin-right ">
             <Scores score={gameState?.score ?? null} />
          </div>
        </div>
      </div>

    </div> 
  )
}
