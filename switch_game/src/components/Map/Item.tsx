"use client";

import { ItemType } from "@/types/game";

export interface ItemProps {
  type: ItemType;
}

export default function Item(_props: ItemProps) {
  if (_props.type === "reverse") {
    return <div></div>;
  }

  if (_props.type === "blinded") {
    return <div></div>;
  }

  if (_props.type === "jump") {
    return <div></div>;
  }
}
