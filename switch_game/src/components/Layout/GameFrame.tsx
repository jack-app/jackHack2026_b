import { ReactNode } from "react";

interface GameFrameProps {
  children: ReactNode;
}

export default function GameFrame({ children }: GameFrameProps) {
  return (
    <div>
      {/* TODO: implement */}
      {children}
    </div>
  );
}
