// File: middleware.ts

import { NextRequest, NextResponse } from "next/server";

const RESERVED_SUBDOMAINS = new Set([
  "www", "app", "admin", "api", "dashboard",
]);

function getSubdomain(host: string): string | null {
  const hostname = host.split(":")[0].trim().toLowerCase();
  const rootDomain = process.env.NEXT_PUBLIC_FRONTEND_ROOT_DOMAIN || "";

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  ) return null;

  if (hostname.endsWith(".localhost")) {
    const sub = hostname.replace(".localhost", "");
    return isValid(sub) ? sub : null;
  }

  if (rootDomain) {
    if (hostname === rootDomain) return null;
    if (hostname.endsWith(`.${rootDomain}`)) {
      const sub = hostname.slice(0, hostname.length - rootDomain.length - 1);
      if (!sub || sub.includes(".")) return null;
      return isValid(sub) ? sub : null;
    }
    return null;
  }

  const parts = hostname.split(".");
  if (parts.length >= 3) {
    return isValid(parts[0]) ? parts[0] : null;
  }

  return null;
}

function isValid(sub: string): boolean {
  if (!sub || RESERVED_SUBDOMAINS.has(sub)) return false;
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(sub);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") || "";
  const subDomain = getSubdomain(host);

  if (!subDomain) {
    if (pathname !== "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)"],
};