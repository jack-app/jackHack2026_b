"use client";

import { useState } from "react";

interface TitleMenuProps {
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
}

export default function TitleMenu({ onCreateRoom, onJoinRoom }: TitleMenuProps) {
  const [roomId, setRoomId] = useState("");

  return (
    <div className="flex flex-col items-center justify-center border border-white-25 bg-[#0d1220] p-10 w-full max-w-xl gap-4">
        <div className='text-5xl text-[oklch(90.1%_0.058_230.902)]' style={{textShadow: '0 0 10px rgba(100,200,255,0.8), 0 0 30px rgba(100,200,255,0.5)'}}>
          SWITCH GAME
        </div>
        {/*--------------------CREATE ROOM--------------------*/}
        <div className="relative w-full">
          {/* ✦ */}
          <span
            className="absolute top-0 right-0 text-xs leading-none z-10"
            style={{
              color: 'rgb(239,68,68)',
              textShadow: '0 0 6px rgba(239,68,68,1), 0 0 12px rgba(239,68,68,0.8)',
              transform: 'translate(2px, -6px)'
            }}
          >
            ✦
          </span>
          <button
            onClick={onCreateRoom}
            className="text-2xl text-white px-8 py-2 w-full"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
              border: '2px solid rgb(239,68,68)',
              boxShadow: '0 0 8px rgba(239,68,68,0.8), inset 0 0 8px rgba(239,68,68,0.8)'
            }}
          >
            CREATE ROOM
          </button>
          {/* ✦ */}
          <span
            className="absolute bottom-0 left-0 text-xs leading-none z-10"
            style={{
              color: 'rgb(239,68,68)',
              textShadow: '0 0 6px rgba(239,68,68,1), 0 0 12px rgba(239,68,68,0.8)',
              transform: 'translate(-2px, 6px)'
            }}
          >
            ✦
          </span>
        </div>
        {/*--------------------JOIN ROOM--------------------*/}
        <div className="relative w-full">
          {/* ✦ */}
          <span
            className="absolute top-0 right-0 text-xs leading-none z-10"
            style={{
              color: 'rgb(59,130,246)',
              textShadow: '0 0 6px rgba(59,130,246,1), 0 0 12px rgba(59,130,246,0.8)',
              transform: 'translate(2px, -6px)'
            }}
          >
            ✦
          </span>
          <button
            onClick={() => { if (roomId.trim()) onJoinRoom(roomId.trim()); }}
            className="text-2xl text-white px-8 py-2 w-full"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
              border: '2px solid rgb(59,130,246)',
              boxShadow: '0 0 8px rgba(59,130,246,0.8), inset 0 0 8px rgba(59,130,246,0.8)'
            }}
          >
            JOIN ROOM
          </button>
          {/* ✦ */}
          <span
            className="absolute bottom-0 left-0 text-xs leading-none z-10"
            style={{
              color: 'rgb(59,130,246)',
              textShadow: '0 0 6px rgba(59,130,246,1), 0 0 12px rgba(59,130,246,0.8)',
              transform: 'translate(-2px, 6px)'
            }}
          >
            ✦
          </span>
        </div>
        {/*--------------------ENTER--------------------*/}
        <div className='text-2xl text-[oklch(98.8% 0.003 106.5)]'>
          <label htmlFor='room_id' className="w-full bg-[#1a2035]">
          ENTER ROOM ID :&nbsp;</label>
          <input type='text' name='roomId' id='room_id' placeholder="Exp: N0_1155"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
          className="border border-white-25 py-2 p-2"
          style ={{
            border:'1px solid rgb(255,255,255)',
            boxShadow:'0 0 8px rgba(255,255,255,0.4), inset 0 0 8px rgba(255,255,255,0.4)'
          }}/>
        </div>
    </div>
  );
}
