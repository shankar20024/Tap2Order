import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // Public routes
  if (
    path === "/" ||
    path === "/login" ||
    path.startsWith("/qr") ||
    path.startsWith("/customer-bill") ||
    path.startsWith("/api/auth") ||
    path.startsWith("/api/order/") ||
    path.startsWith("/api/business/info") ||
    path.startsWith("/_next") ||
    path === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Unauthenticated redirect (only for HTML requests)
  if (!token?.id && !path.startsWith("/api")) {
    const acceptHeader = req.headers.get("accept") || "";
    if (acceptHeader.includes("text/html")) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // Authenticated user visiting /login → redirect based on role
  if (token?.id && path === "/login") {
    url.pathname = token.role === "admin" ? "/admin" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // Role-based redirects
  if (token?.role === "admin" && path.startsWith("/dashboard")) {
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  if (token?.role === "user" && path.startsWith("/admin")) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Department-based redirects (your existing logic)
  if (token?.isStaff && token?.department) {
    const departmentPages = {
      kitchen: "/kitchen",
      service: "/waiter",
      management: "/dashboard",
      cleaning: "/login",
      other: "/login",
    };

    const allowedPage = departmentPages[token.department];

    if (path === "/kitchen" && token.department !== "kitchen") {
      return NextResponse.redirect(new URL(allowedPage || "/login", req.url));
    }

    if (path === "/waiter" && token.department !== "service") {
      return NextResponse.redirect(new URL(allowedPage || "/login", req.url));
    }

    if (path === "/dashboard" && token.department !== "management" && !token.isOwner) {
      return NextResponse.redirect(new URL(allowedPage || "/login", req.url));
    }

    if (
      ["cleaning", "other"].includes(token.department) &&
      ["/kitchen", "/waiter", "/dashboard"].includes(path)
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Prevent staff from accessing owner-only pages
  if (token?.isStaff && !token?.isOwner) {
    const ownerOnlyPages = ["/admin", "/profile", "/staff"];
    if (ownerOnlyPages.some(page => path.startsWith(page))) {
      const departmentPages = {
        kitchen: "/kitchen",
        service: "/waiter",
        management: "/dashboard",
        cleaning: "/login",
        other: "/login",
      };
      const allowedPage = departmentPages[token.department] || "/login";
      return NextResponse.redirect(new URL(allowedPage, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/|_vercel|favicon.ico).*)"],
};
