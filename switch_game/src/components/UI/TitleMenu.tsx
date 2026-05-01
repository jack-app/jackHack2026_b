"use client";

interface TitleMenuProps {
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
}

export default function TitleMenu({ onCreateRoom, onJoinRoom }: TitleMenuProps) {
  return (
    <div>
      {/* TODO: implement - create room button, join room form */}
    </div>
  );
}
