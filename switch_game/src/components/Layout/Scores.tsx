interface ScoresProps {
  score: { red: number; blue: number } | null;
}

export default function Scores({ score }: ScoresProps) {
  return (
    <div>
      {/* TODO: implement - display red and blue team scores; show nothing when null */}
    </div>
  );
}
