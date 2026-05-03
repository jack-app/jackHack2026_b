import Image from "next/image";

interface TileProps {
  cell: number | string;
  size?: number;
  switchState?: "red" | "blue" | null;
  switchWeight?: number;
}

export default function Tile({ cell, size = 40, switchState }: TileProps) {
  const s = { width: size, height: size };
  const inner = Math.round(size * 0.8);

  // 壁
  if (cell === 1)
    return (
      <div className="relative bg-stone-400" style={s}>
        <Image src="/PikPng.com_crack-png_3016889.png" fill alt="" style={{ objectFit: "cover" }} />
      </div>
    );

  // 床
  if (cell === 0)
    return <div className="border border-slate-500" style={s}></div>;

  // スイッチ赤
  if (switchState === "red")
    return (
      <div className="relative bg-red-700 drop-shadow-[0_0_10px_rgba(231,0,11,0.8)]" style={s}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center justify-center bg-red-500 text-red-300 font-bold"
            style={{ width: inner, height: inner, fontSize: Math.round(inner * 0.5) }}>R</div>
        </div>
      </div>
    );

  // スイッチ青
  if (switchState === "blue")
    return (
      <div className="relative bg-blue-700 drop-shadow-[0_0_10px_rgba(21,93,251,0.8)]" style={s}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center justify-center bg-blue-500 text-blue-300 font-bold"
            style={{ width: inner, height: inner, fontSize: Math.round(inner * 0.5) }}>B</div>
        </div>
      </div>
    );

  // スイッチ（未取得）
  if (switchState === null)
    return (
      <div className="relative bg-stone-400 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" style={s}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-stone-200" style={{ width: inner, height: inner }}></div>
        </div>
      </div>
    );
}
