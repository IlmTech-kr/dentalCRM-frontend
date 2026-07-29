import { NextRequest, NextResponse } from "next/server";
import { ROOT_ALLOWED_PATHS, resolveHostContext } from "@/src/lib/tenant";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") || "";
  const ctx = resolveHostContext(host);

  // --- ROOT DOMAIN (dental.ilmtech.uz) ---
  if (ctx.type === "root") {
    if (!ROOT_ALLOWED_PATHS.has(pathname)) {
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
