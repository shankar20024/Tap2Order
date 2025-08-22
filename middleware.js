import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // Public paths that don't require authentication
  if (
    path.startsWith("/qr") ||
    path === "/login" ||
    path === "/" ||
    path === "/favicon.ico" ||
    path.startsWith("/_next") ||
    path.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Block access to protected routes if not authenticated
  if (!token?.id) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If authenticated and visiting login page, redirect to appropriate dashboard
  if (token?.id && path === "/login") {
    url.pathname = token.role === "admin" ? "/admin" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // Role-based access control
  if (token?.role === "admin" && path.startsWith("/dashboard")) {
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  if (token?.role === "user" && path.startsWith("/admin")) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Department-based routing middleware
  if (token?.isStaff && token?.department) {
    const departmentPages = {
      'kitchen': '/kitchen',
      'service': '/waiter', 
      'management': '/dashboard',
      'cleaning': '/login', // No specific page, redirect to login
      'other': '/login' // No specific page, redirect to login
    };

    const allowedPage = departmentPages[token.department];
    
    // If staff is trying to access a page not meant for their department
    if (path === '/kitchen' && token.department !== 'kitchen') {
      return NextResponse.redirect(new URL(allowedPage || '/login', req.url));
    }
    
    if (path === '/waiter' && token.department !== 'service') {
      return NextResponse.redirect(new URL(allowedPage || '/login', req.url));
    }
    
    if (path === '/dashboard' && token.department !== 'management' && !token.isOwner) {
      return NextResponse.redirect(new URL(allowedPage || '/login', req.url));
    }
    
    // If staff department has no specific page, redirect to login
    if (['cleaning', 'other'].includes(token.department) && 
        ['/kitchen', '/waiter', '/dashboard'].includes(path)) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Prevent staff from accessing owner-only pages
  if (token?.isStaff && !token?.isOwner) {
    const ownerOnlyPages = ['/admin', '/profile', '/staff'];
    if (ownerOnlyPages.some(page => path.startsWith(page))) {
      const departmentPages = {
        'kitchen': '/kitchen',
        'service': '/waiter', 
        'management': '/dashboard',
        'cleaning': '/login', // No specific page, redirect to login
        'other': '/login' // No specific page, redirect to login
      };
      const allowedPage = departmentPages[token.department] || '/login';
      return NextResponse.redirect(new URL(allowedPage, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
