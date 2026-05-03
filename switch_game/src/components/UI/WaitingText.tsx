/*"use client";

interface WaitingTextProps {
  isHost: boolean;
  onStartGame: () => void;
}

export default function WaitingText({ isHost, onStartGame }: WaitingTextProps) {
  return (
    <div>
      {/* TODO: implement - waiting message, start button (host only) }
      Waiting for other players...
      {isHost && (
        <button onClick={onStartGame} className="ml-4 px-4 py-2 bg-blue-500 text-white rounded">
          Start Game
        </button>
      )}
    </div>
  );
}*/

"use client";

interface WaitingTextProps {
  isHost: boolean;
  onStartGame: () => void;
}

// アイテムのデータ定義
const ITEMS = [
  { id: "reverse", name: "REVERSE", desc: "相手の上下・左右の操作を反転！", color: "border-green-400", shadow: "shadow-cyan-500/50", pos: "left-[120%]" },
  { id: "blind", name: "BLIND", desc: "相手の見える範囲が狭くなる！！", color: "border-purple-500", shadow: "shadow-purple-500/50", pos: "right-[120%]" },
  { id: "jump", name: "JUMP", desc: "壁を飛び越えての移動が可能に！", color: "border-orange-400", shadow: "shadow-green-500/50", pos: "left-[120%]" },
];

export default function WaitingText({ isHost, onStartGame }: WaitingTextProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] space-y-12 text-white bg-slate-950 p-10 rounded-xl border border-white/10">
      
      {/* 待機メッセージセクション */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-black tracking-[0.3em] animate-pulse text-cyan-300 text-shadow-cyan-200 text-shadow-md ">
          WAITING FOR PLAYERS...
        </h2>
        {isHost && (
          <button 
            onClick={onStartGame} 
            className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)]"
          >
            START MISSION
          </button>
        )}
      </div>
      <div className="text-cyan-200 font-bold">
       I T E M S
      </div>

      {/* アイテムリストセクション (IMG_7110.jpg の再現) */}
      <div className="flex flex-col items-center space-y-10 relative">
        {ITEMS.map((item) => (
          <div key={item.id} className="relative group">
            
            {/* アイテム画像スロット */}
            <div className={`w-20 h-20 bg-black border-2 ${item.color} ${item.shadow} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] cursor-help`}>
               <div className="text-[10px] text-gray-500 font-bold">IMAGE</div>
            </div>
            
            {/* アイテム名 */}
            <p className={`text-center mt-2 text-xs font-bold tracking-widest uppercase opacity-70 group-hover:opacity-100 transition-opacity`}>
              {item.name}
            </p>

            {/* 赤い六角形吹き出し */}
            <div className={`absolute ${item.pos} top-0 opacity-0 scale-75 translate-y-4 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 z-50`}>
              <div 
                className="bg-black/90 border-2 border-cyan-300 px-6 py-4 min-w-[180px] [0_0_30px_rgba(220,38,38,0.4)]"
                style={{ clipPath: "polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)" }}
              >
                <p className=" font-black text-center text-sm drop-shadow-[0_0_8px_rgba(0,160,233,0.8)]">
                  {item.desc}
                </p>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
