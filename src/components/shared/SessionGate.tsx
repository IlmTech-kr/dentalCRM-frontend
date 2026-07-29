"use client";

import { ReactNode } from "react";
import DentalLoader from "@/src/components/ui/DentalLoader";

interface SessionGateProps {
  ready: boolean;
  loadingText?: string;
  children: ReactNode;
}

/**
 * Thin presentational gate: renders the fullScreen DentalLoader while a
 * caller's own async session/auth check is still in flight, then renders
 * children once ready. Does not perform any check itself — callers keep
 * their existing useEffect logic and just flip `ready`.
 */
export default function SessionGate({ ready, loadingText, children }: SessionGateProps) {
  if (!ready) {
    return <DentalLoader fullScreen text={loadingText} />;
  }

  return <>{children}</>;
}
