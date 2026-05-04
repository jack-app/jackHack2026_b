"use client";

import { ItemType } from "@/types/game";

import Image from "next/image";

export interface ItemProps {
  type: ItemType;
}

const ITEM_SRC: Record<ItemType, string> = {
  reverse: "/item_arrow_2.png",
  blind: "/item_blined.png",
  jump: "/item_jump.png",
};

export default function Item({ type }: ItemProps) {
  return (
    <div className="relative w-8 h-8 overflow-hidden">
      <Image
        src={ITEM_SRC[type]}
        fill
        style={{ objectFit: "contain" }}
        alt={type}
      />
    </div>
  );
}
