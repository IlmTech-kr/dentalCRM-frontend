"use client";

import type { LucideIcon } from "lucide-react";
import DentalLoader from "@/src/components/ui/DentalLoader";

export function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 p-6 text-center">
      <Icon className="h-10 w-10 text-slate-300" />
      <p className="text-sm font-semibold text-slate-500">{message}</p>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <DentalLoader fullScreen={false} />
    </div>
  );
}
