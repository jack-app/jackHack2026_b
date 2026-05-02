interface ScoresProps {
  score: { red: number; blue: number } | null;
}

export default function Scores({ score }: ScoresProps) {
  return (
<div>
      {/* TODO: implement - display red and blue team scores; show nothing when null */}
  <div className="flex justify-end text-xl">SCORES</div>  
  <div className="flex justify-end gap-5">
    <div>
      <div className="flex items-center justify-center bg-red-500 drop-shadow-[0_0_8px_rgba(231,0,11,0.8)] text-black text-sm w-30 h-4">TEAM RED</div>
      <div className="place-self-center text-red-500 drop-shadow-[0_0_8px_rgba(231,0,11,0.8)] text-5xl">10</div>
    </div>
    <div>
      <div className="flex items-center justify-center bg-blue-500 drop-shadow-[0_0_8px_rgba(21,93,251,0.8)] text-black text-sm w-30 h-4">TEAM BLUE</div>
      <div className="place-self-center text-blue-500 drop-shadow-[0_0_8px_rgba(21,93,251,0.8)] text-5xl">05</div>
    </div>
  </div>
</div>


  );
}
