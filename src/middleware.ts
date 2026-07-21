import { NextRequest, NextResponse } from "next/server";

/**
 * "admin" endi tenant subdomain sifatida ishlatilmaydi — u maxsus
 * SUPERADMIN paneli uchun ajratilgan. Shuning uchun RESERVED_SUBDOMAINS
 * ichida emas, alohida konstantada.
 */
const RESERVED_SUBDOMAINS = new Set(["www", "app", "api", "dashboard"]);
const SUPER_ADMIN_SUBDOMAIN = "admin";

/**
 * Subdomain'siz (root domain) ochilishi mumkin bo'lgan pathlar.
 * Bularga kirganda "/" ga redirect qilinmaydi.
 */
const ALLOWED_ROOT_PATHS = new Set(["/", "/register", "/login", "/tariffs"]);

type HostContext =
  | { type: "root" }
  | { type: "superadmin" }
  | { type: "tenant"; subDomain: string };

function isValidSubdomain(sub: string): boolean {
  if (!sub) return false;
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(sub);
}

function resolveHost(host: string): HostContext {
  const hostname = host.split(":")[0].trim().toLowerCase();
  const rootDomain = process.env.NEXT_PUBLIC_FRONTEND_ROOT_DOMAIN || "";

  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return { type: "root" };
  }

  let sub: string | null = null;

  if (hostname.endsWith(".localhost")) {
    sub = hostname.replace(".localhost", "");
  } else if (rootDomain) {
    if (hostname === rootDomain) return { type: "root" };
    if (hostname.endsWith(`.${rootDomain}`)) {
      const candidate = hostname.slice(0, hostname.length - rootDomain.length - 1);
      if (candidate && !candidate.includes(".")) sub = candidate;
    }
  } else {
    const parts = hostname.split(".");
    if (parts.length >= 3) sub = parts[0];
  }

  if (!sub || !isValidSubdomain(sub)) return { type: "root" };
  if (sub === SUPER_ADMIN_SUBDOMAIN) return { type: "superadmin" };
  if (RESERVED_SUBDOMAINS.has(sub)) return { type: "root" };

  return { type: "tenant", subDomain: sub };
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") || "";
  const ctx = resolveHost(host);

  // --- ROOT DOMAIN (dental.ilmtech.uz) ---
  if (ctx.type === "root") {
    if (!ALLOWED_ROOT_PATHS.has(pathname)) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // --- SUPERADMIN (admin.dental.ilmtech.uz) ---
  if (ctx.type === "superadmin") {
    if (pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Tashqi URL toza qoladi (/login, /dashboard, ...),
    // lekin ichkarida src/app/superadmin/* sahifalari render bo'ladi.
    if (!pathname.startsWith("/superadmin")) {
      const url = req.nextUrl.clone();
      url.pathname = `/superadmin${pathname}`;
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  // --- TENANT (clinic1.dental.ilmtech.uz) ---
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