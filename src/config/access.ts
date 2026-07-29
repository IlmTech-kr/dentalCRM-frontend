/**
 * Route -> allowed-role map, read by (clinic)/layout.tsx and
 * superadmin/(admin-panel)/layout.tsx. This carries ONLY restrictions that
 * already existed in code before this file existed (see
 * docs/access-recommendations.md for proposed additions, not applied here).
 */

import { Role } from "@/src/lib/enums/enums.types";

export interface AccessRule {
  prefix: string;
  roles: Role[];
}

export const CLINIC_ACCESS_RULES: AccessRule[] = [
  { prefix: "/patients", roles: [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.RECEPTIONIST, Role.ASSISTANT] },
  { prefix: "/appointments", roles: [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.RECEPTIONIST, Role.ASSISTANT] },
];

export const SUPERADMIN_ACCESS_RULES: AccessRule[] = [];

/**
 * Longest-prefix-wins: if multiple rules' prefixes match pathname, the one
 * with the longest prefix decides. Returns null when no rule matches —
 * callers must treat null as "no role restriction, auth only".
 */
export function getRequiredRoles(pathname: string, rules: AccessRule[]): Role[] | null {
  let best: AccessRule | null = null;

  for (const rule of rules) {
    if (!pathname.startsWith(rule.prefix)) continue;
    if (!best || rule.prefix.length > best.prefix.length) {
      best = rule;
    }
  }

  return best ? best.roles : null;
}

export function isRouteAllowed(pathname: string, userRoles: Role[], rules: AccessRule[]): boolean {
  const required = getRequiredRoles(pathname, rules);
  if (required === null) return true;
  return userRoles.some((role) => required.includes(role));
}
