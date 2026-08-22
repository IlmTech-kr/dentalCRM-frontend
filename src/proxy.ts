import { NextRequest, NextResponse } from "next/server";
import { ROOT_ALLOWED_PATHS, resolveHostContext } from "@/src/lib/tenant";

/** Anything in public/ — never route these through tenant logic. */
const STATIC_PREFIXES = ["/frames/", "/img/", "/fonts/"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static assets bypass all tenant routing.
  if (
    STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    /\.(webp|png|jpe?g|svg|gif|ico|avif|woff2?|ttf|otf|mp4|webm|json|txt|xml|webmanifest)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

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
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|site.webmanifest|frames|img|.*\\..*).*)",
  ],
};