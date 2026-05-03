"use client";

import { ItemType } from "@/types/game";

import Image from "next/image";


export interface ItemProps {
  type: ItemType;
}

export default function Item(_props: ItemProps) {
  if (_props.type === "reverse") {
    return <div className="w-10 h-10">
      <Image
      src="/item_arrow_2.png"
      width={100}
      height={100}
      alt=""
      />
    </div>;
  }

  if (_props.type === "blinded") {
    return <div className="w-10 h-10">
      <Image
      src="/item_blined.png"
      width={100}
      height={100}
      alt=""
      />
    </div>;
  }

  if (_props.type === "jump") {
    return <div className="w-10 h-10" >
      <Image
      src="/item_jump.png"
      width={100}
      height={100}
      alt=""
      />
    </div>;
  
  }
}
