interface TileProps {
  cell: number | string;
  switchState?: "red" | "blue" | null;
  switchWeight?: number;
}

export default function Tile({ cell, switchState, switchWeight }: TileProps) {
  
  if (cell === 0) {
    return (
      <div className="h-10 w-10 bg-blue-950">
        W
      </div>
    );
  }
  if (cell === 1) return (
    <div className="h-10 w-10 bg-green-950">
      F
    </div>
  );
  return (
    <div className="h-10 w-10 bg-purple-950">
      S
    </div>
  );
}
