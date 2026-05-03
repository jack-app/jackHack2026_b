import Image from "next/image";

interface TileProps {
  cell: number | string;
  switchState?: "red" | "blue" | null;
  switchWeight?: number;
}

export default function Tile({ cell, switchState, switchWeight }: TileProps) {

  const wall = cell === 0;
  const floor = cell === 1;
  // const switch = typeof cell === "string" && cell.startsWith("s");

  const base =  "w-10 h-10 flex items-center justify-center text-white font-bold";
  // const wall = 


// 壁
  if (cell ===  0)return(
    <div
  className="bg-white w-10 h-10"
    >
     <Image
      src="/PikPng.com_crack-png_3016889.png"
      width={50}
      height={10}
      alt=""
     />
   </div>

  )

  // 床
  if (cell===1)return(
    <div className="w-10 h-10 bg-white">
      
    </div>
  )


// スイッチ
  return (
    <div className="w-10 h-10 bg-green-400">
      {/* TODO: implement - 0: wall, 1: floor, "sXX": switch */}

      <div className="">
        
      </div>

    </div>
  );
}
