"use client";
import { useEffect } from "react";
import { useAppearance } from "./hooks/useSettings";
import { useUiStore } from "@/src/store/ui.store";

export default function ThemeSettingsSync(){
  const {data}=useAppearance(); const apply=useUiStore(s=>s.applyAppearance);
  useEffect(()=>{if(data)apply(data);},[data,apply]);
  useEffect(()=>{if(!data||data.mode!=="SYSTEM")return;const media=window.matchMedia("(prefers-color-scheme: dark)");const sync=()=>apply(data);media.addEventListener("change",sync);return()=>media.removeEventListener("change",sync);},[data,apply]);
  return null;
}
