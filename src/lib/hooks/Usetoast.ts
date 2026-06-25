/**
 * File: src/lib/hooks/Usetoast.ts
 */

import { useMemo } from "react";
import { useToastStore } from "@/src/store/Usetoaststore";

/**
 * Toast notification hook.
 *
 * useMemo bilan stabillantirilgan — har render da yangi object
 * yaratilmaydi. useEffect dependency sifatida xavfsiz ishlatish mumkin.
 *
 * Usage:
 * const toast = useToast();
 * toast.success("Profile updated!");
 * toast.error("Failed to save");
 * toast.warning("This is deprecated");
 * toast.info("Just so you know");
 */
export function useToast() {
  const addToast = useToastStore((state) => state.addToast);

  return useMemo(
    () => ({
      success: (message: string, duration?: number) =>
        addToast("success", message, duration),

      error: (message: string, duration?: number) =>
        addToast("error", message, duration),

      warning: (message: string, duration?: number) =>
        addToast("warning", message, duration),

      info: (message: string, duration?: number) =>
        addToast("info", message, duration),
    }),
    [addToast]
  );
}