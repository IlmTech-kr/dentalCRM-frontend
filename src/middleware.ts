// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getSubdomainFromHost } from "./lib/utils/tenant";


export function middleware(req: NextRequest) {
  const host = req.headers.get("host");
  
  if (!host) {
    return NextResponse.next();
  }

  const subDomain = getSubdomainFromHost(host);

  const response = NextResponse.next();

  if (subDomain) {
    response.headers.set("x-tenant-id", subDomain);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)"],
};