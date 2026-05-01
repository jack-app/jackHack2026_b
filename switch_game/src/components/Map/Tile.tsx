interface TileProps {
  cell: number | string;
  switchState?: "red" | "blue" | null;
  switchWeight?: number;
}

export default function Tile({ cell, switchState, switchWeight }: TileProps) {
  return (
    <div>
      {/* TODO: implement - 0: wall, 1: floor, "sXX": switch */}
    </div>
  );
}
