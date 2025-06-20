import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const url = req.nextUrl.clone();
  const path = url.pathname;


  // ✅ Public path allowed: /qr/anything
  if (path.startsWith("/qr")) {
    return NextResponse.next();
  }


  // 🔒 Block all other routes if not logged in
  if (!token && (path.startsWith("/dashboard") || path.startsWith("/admin") || path.startsWith("/menu") || path.startsWith("/table"))) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ✅ If logged in and visiting / or /login — redirect based on role
  if (token && (path === "/" || path === "/login")) {
    url.pathname = token.role === "admin" ? "/admin" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // 🛡️ Admin trying to access user dashboard/menu/table
  if (token?.role === "admin" && (path.startsWith("/dashboard") || path.startsWith("/menu") || path.startsWith("/table"))) {
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  // 🛡️ User trying to access /admin
  if (token?.role === "user" && path.startsWith("/admin")) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/admin/:path*", "/menu/:path*", "/table/:path*", "/me"],
};
