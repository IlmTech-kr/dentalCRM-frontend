"use client";

import { getSubdomainFromHost } from "@/src/lib/tenant";

export function getCurrentSubdomain(): string | null {
  if (typeof window === "undefined") return null;
  return getSubdomainFromHost(window.location.host);
}

export function isTenantUrl(): boolean {
  return Boolean(getCurrentSubdomain());
}
