import TopHeader, { TopHeaderProps } from "./TopHeader";
import Board, { BoardProps } from "../Map/Board";

interface GameFrameProps {
  topHeaderProps: TopHeaderProps;
  boardProps?: BoardProps;
}

export default function GameFrame({ topHeaderProps, boardProps }: GameFrameProps) {
  return (
    <div>
      <TopHeader {...topHeaderProps} />
      {boardProps && <Board {...boardProps} />}
    </div>
  );
}
