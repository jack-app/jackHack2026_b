import Image from "next/image";

interface TileProps {
  cell: number | string;
  switchState?: "red" | "blue" | null;
  switchWeight?: number;
}

export default function Tile({ cell, switchState, switchWeight }: TileProps) {
  // 壁
  if (cell === 1)
    return (
      <div className="bg-stone-400 w-10 h-10">
        <Image
          src="/PikPng.com_crack-png_3016889.png"
          width={50}
          height={10}
          alt=""
        />
      </div>
    );

  // 床
  if (cell === 0)
    return <div className="w-10 h-10 border border-slate-500"></div>;

  // スイッチ赤
  if (switchState === "red")
    return (
      <div className="relative w-10 h-10 bg-red-700 drop-shadow-[0_0_10px_rgba(231,0,11,0.8)] text-2xl">
        <div className="absolute w-14 rotate-45 border-t border-red-500 origin-left"></div>
        <div className="absolute w-14 -rotate-45 border-b border-red-500 origin-top-left top-10"></div>
        <div className="absolute top-1 left-1 flex items-center justify-center bg-red-500 w-8 h-8 text-red-300">
          R
        </div>
      </div>
    );

  // スイッチ青
  if (switchState === "blue")
    return (
      <div className="relative w-10 h-10 bg-blue-700 drop-shadow-[0_0_10px_rgba(21,93,251,0.8)] text-2xl">
        <div className="absolute w-14 rotate-45 border-t border-blue-500 origin-left"></div>
        <div className="absolute w-14 -rotate-45 border-b border-blue-500 origin-top-left top-10"></div>
        <div className="absolute top-1 left-1 flex items-center justify-center bg-blue-500 w-8 h-8 text-blue-300">
          B
        </div>
      </div>
    );
  // スイッチ
  if (switchState === null)
    return (
      <div className="relative w-10 h-10 bg-stone-400 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] text-2xl">
        <div className="absolute w-14 rotate-45 border-t border-stone-200 origin-left"></div>
        <div className="absolute w-14 -rotate-45 border-b border-stone-200 origin-top-left top-10"></div>
        <div className="absolute top-1 left-1 flex items-center justify-center bg-stone-200 w-8 h-8 text-blue-300"></div>
      </div>
    );
}
