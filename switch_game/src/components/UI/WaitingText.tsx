"use client";

import Image from "next/image";

interface WaitingTextProps {
  isHost: boolean;
  onStartGame: () => void;
}

const ITEMS = [
  {
    id: "reverse",
    imageSrc: "/item_arrow_2.png",
    name: "REVERSE",
    desc: "相手の上下・左右の操作を反転！",
    color: "border-green-400",
    shadow: "shadow-cyan-500/50",
    pos: "bottom-full left-1/2 -translate-x-1/2 mb-5",
  },
  {
    id: "blind",
    imageSrc: "/item_blined.png",
    name: "BLIND",
    desc: "相手の見える範囲が狭くなる！！",
    color: "border-purple-500",
    shadow: "shadow-purple-500/50",
    pos: "bottom-full left-1/2 -translate-x-1/2 mb-5",
  },
  {
    id: "jump",
    imageSrc: "/item_jump.png",
    name: "JUMP",
    desc: "壁を飛び越えての移動が可能に！",
    color: "border-orange-400",
    shadow: "shadow-green-500/50",
    pos: "bottom-full left-1/2 -translate-x-1/2 mb-5",
  },
];

export default function WaitingText({ isHost, onStartGame }: WaitingTextProps) {
  return (
    /* 外側のグローを少し戻してリッチに */
    <div className="relative w-fit mx-auto p-[1px] filter drop-shadow-[0_0_20px_rgba(6,182,212,0.2)]">
      
      <div 
        className="flex flex-col items-center justify-center text-white bg-slate-950/70 px-20 py-12 relative overflow-visible backdrop-blur-md"
        style={{
          clipPath: "polygon(30px 0%, calc(100% - 30px) 0%, 100% 30px, 100% calc(100% - 30px), calc(100% - 30px) 100%, 30px 100%, 0% calc(100% - 30px), 0% 30px)",
          border: "1.5px solid rgba(34, 211, 238, 0.6)" 
        }}
      >
        
        {/* 上下の装飾ライン */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-[3px] bg-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/4 h-[3px] bg-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />

        {/* 待機メッセージセクション */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black tracking-[0.3em] animate-pulse text-cyan-300 text-shadow-md mb-8">
            WAITING FOR PLAYERS...
          </h2>
          {isHost && (
            <button
              onClick={onStartGame}
              className="px-10 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)]"
            >
              START MISSION
            </button>
          )}
        </div>

        {/* ITEMSラベル */}
        <div className="text-cyan-200 text-xs font-bold mb-10 tracking-[0.4em] border-b border-cyan-500/30 pb-2">
          I T E M S
        </div>

        {/* アイテムリスト */}
        <div className="flex flex-row items-center space-x-10">
          {ITEMS.map((item) => (
            <div key={item.id} className="relative group flex flex-col items-center">
              <div
                className={`w-18 h-18 bg-black/60 border-2 ${item.color} ${item.shadow} flex items-center justify-center transition-all duration-300 group-hover:scale-110 cursor-help`}
              >
                <Image
                  src={item.imageSrc}
                  alt={item.name}
                  width={32}
                  height={32}
                />
              </div>

              <p className="text-center mt-3 text-[11px] font-bold tracking-widest uppercase text-gray-300 group-hover:text-white transition-colors">
                {item.name}
              </p>

              {/* ツールチップ（六角形デザインを維持） */}
              <div className={`absolute ${item.pos} opacity-0 scale-75 translate-y-4 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 z-50`}>
                <div
                  className="bg-black/90 border-2 border-cyan-300 px-6 py-4 min-w-[180px] shadow-2xl"
                  style={{
                    clipPath: "polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)",
                  }}
                >
                  <p className="font-black text-center text-sm text-white drop-shadow-[0_0_8px_rgba(0,160,233,0.8)]">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}