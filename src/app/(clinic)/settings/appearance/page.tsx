"use client";
import { useEffect, useState } from "react";
import { Check, Laptop, Moon, Palette, Save, Sun } from "lucide-react";
import { ACCENT_PRESETS, DEFAULT_ACCENT_COLOR } from "@/src/lib/theme/accentColor";
import { useAppearance, useSaveAppearance } from "@/src/features/settings/hooks/useSettings";
import { useUiStore } from "@/src/store/ui.store";
import { useToast } from "@/src/lib/hooks/Usetoast";
import type { AccentType, ThemeMode } from "@/src/types/settings.types";

const MODES:{value:ThemeMode;label:string;icon:typeof Sun;hint:string}[]=[
  {value:"SYSTEM",label:"Tizim",icon:Laptop,hint:"Qurilma sozlamasiga mos"},
  {value:"LIGHT",label:"Yorug'",icon:Sun,hint:"Doim yorug' ko'rinish"},
  {value:"DARK",label:"Tungi",icon:Moon,hint:"Ko'z uchun yumshoq"},
];
export default function AppearancePage(){
  const {data,isLoading,error}=useAppearance();const save=useSaveAppearance();const toast=useToast();const apply=useUiStore(s=>s.applyAppearance);
  const [mode,setMode]=useState<ThemeMode>("LIGHT");const [accentType,setAccentType]=useState<AccentType>("DEFAULT");const [color,setColor]=useState(DEFAULT_ACCENT_COLOR);
  useEffect(()=>{if(data){setMode(data.mode);setAccentType(data.accentType);setColor(data.effectiveAccentColor);}},[data]);
  useEffect(()=>{apply({mode,accentType,customAccentColor:accentType==="CUSTOM"?color:null,effectiveAccentColor:accentType==="CUSTOM"?color:DEFAULT_ACCENT_COLOR});},[mode,accentType,color,apply]);
  async function submit(){try{await save.mutateAsync({mode,accentType,customAccentColor:accentType==="CUSTOM"?color:null});toast.success("Tema barcha qurilmalaringiz uchun saqlandi");}catch(e){toast.error(e instanceof Error?e.message:"Saqlashda xatolik");}}
  if(isLoading)return <div className="h-72 animate-pulse rounded-3xl bg-white"/>;
  return <div className="mx-auto max-w-5xl space-y-6">
    <header><p className="text-xs font-black uppercase tracking-[.22em] text-primary-blue">Shaxsiy ko‘rinish</p><h1 className="mt-2 text-2xl font-black text-slate-900">Dashboard temasi</h1><p className="mt-1 text-sm text-slate-500">Ko‘rinish profilingizga bog‘lanadi va boshqa qurilmalarda ham tiklanadi.</p></header>
    {error?<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</div>:null}
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="font-black text-slate-900">Yorug‘lik rejimi</h2><div className="mt-4 grid gap-3 sm:grid-cols-3">{MODES.map(m=>{const I=m.icon;const selected=mode===m.value;return <button key={m.value} onClick={()=>setMode(m.value)} className={`rounded-2xl border p-4 text-left transition ${selected?"border-primary-blue bg-primary-blue/5 ring-2 ring-primary-blue/15":"border-slate-200 hover:border-slate-300"}`}><div className="flex items-center justify-between"><I className={selected?"text-primary-blue":"text-slate-500"}/>{selected?<Check className="text-primary-blue" size={18}/>:null}</div><p className="mt-5 font-black text-slate-900">{m.label}</p><p className="mt-1 text-xs text-slate-500">{m.hint}</p></button>})}</div></section>
    <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:grid-cols-[1fr_280px]"><div><h2 className="font-black text-slate-900">Accent rangi</h2><p className="mt-1 text-sm text-slate-500">Tugmalar, navigatsiya va faol elementlar rangi.</p><div className="mt-5 flex flex-wrap gap-3"><button onClick={()=>setAccentType("DEFAULT")} className={`rounded-xl border px-4 py-2 text-sm font-bold ${accentType==="DEFAULT"?"border-primary-blue text-primary-blue":"border-slate-200 text-slate-500"}`}>Standart</button><button onClick={()=>setAccentType("CUSTOM")} className={`rounded-xl border px-4 py-2 text-sm font-bold ${accentType==="CUSTOM"?"border-primary-blue text-primary-blue":"border-slate-200 text-slate-500"}`}>Maxsus rang</button></div>{accentType==="CUSTOM"?<div className="mt-5 flex flex-wrap items-center gap-3">{ACCENT_PRESETS.map(p=><button aria-label={p.name} key={p.value} onClick={()=>setColor(p.value)} className="h-10 w-10 rounded-xl ring-2 ring-white shadow" style={{backgroundColor:p.value,outline:color.toLowerCase()===p.value.toLowerCase()?`2px solid ${p.value}`:undefined}}/>)}<label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600"><Palette size={16}/><input type="color" value={color} onChange={e=>setColor(e.target.value)} className="h-7 w-9 bg-transparent"/>{color.toUpperCase()}</label></div>:null}</div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"><div className="p-4 text-sm font-black text-white" style={{backgroundColor:accentType==="CUSTOM"?color:DEFAULT_ACCENT_COLOR}}>Jonli ko‘rinish</div><div className="space-y-3 p-4"><div className="h-3 w-2/3 rounded bg-slate-200"/><button className="w-full rounded-xl py-2.5 text-sm font-black text-white" style={{backgroundColor:accentType==="CUSTOM"?color:DEFAULT_ACCENT_COLOR}}>Asosiy tugma</button></div></div></section>
    <div className="flex justify-end"><button onClick={submit} disabled={save.isPending} className="inline-flex items-center gap-2 rounded-2xl bg-primary-blue px-6 py-3 text-sm font-black text-white shadow-lg shadow-primary-blue/20 disabled:opacity-50"><Save size={17}/>{save.isPending?"Saqlanmoqda...":"O‘zgarishlarni saqlash"}</button></div>
  </div>;
}
