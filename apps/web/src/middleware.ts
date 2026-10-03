import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicPath = path === "/login" || path === "/signup";
  const token = req.cookies.get("token")?.value || null;

  if (token && isPublicPath) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/signup"],
};
