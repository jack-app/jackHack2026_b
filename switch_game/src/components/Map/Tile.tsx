interface TileProps {
  cell: number | string;
  switchState?: "red" | "blue" | null;
  switchWeight?: number;
}

export default function Tile({ cell, switchState, switchWeight }: TileProps) {

  const wall = cell === 0;
  const floor = cell === 1;
  const switch = typeof cell === "string" && cell.startsWith("s");

  const base =  "w-10 h-10 flex items-center justify-center text-white font-bold";
  const wall = 


  return (
    <div className="text-sm">
      {/* TODO: implement - 0: wall, 1: floor, "sXX": switch */}

      <div className="">
        
      </div>

    </div>
  );
}
