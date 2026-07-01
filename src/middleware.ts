// File: middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { getSubdomainFromHost } from "@/src/lib/utils/tenant";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") || "";
  const subDomain = getSubdomainFromHost(host);

  if (!subDomain) {
    // Subdomain yo'q → landing page (hozircha yo'q bo'lsa root da qoladi)
    return NextResponse.next();
  }

  // Subdomain bor → faqat /login va /dashboard ga ruxsat
  // / ga kirsa /login ga redirect
  if (pathname === "/") {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)"],
};