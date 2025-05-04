import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  role?: string[] | string;
  sub?: string;
  name?: string;
  exp?: number;
}

export function middleware(request: NextRequest) {
  // Check for the access token in cookies or session storage
  const token = request.cookies.get('RefreshToken')?.value;
  // Note: sessionStorage is not accessible in middleware as it runs on the server
  // We rely on cookies for middleware authentication
  
  const { pathname } = request.nextUrl;
  
  // Define public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/', '/landing', '/auth/access'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/api/'));
  
  // Admin-only routes
  const isAdminRoute = pathname.startsWith('/admin');
  
  // Protected routes (require any authentication)
  const isProtectedRoute = !isPublicRoute;
  
  // If the route is protected and there's no token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // Handle admin routes - check for Admin role in token
  if (isAdminRoute && token) {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      
      // Extract roles from token
      let roles: string[] = [];
      if (typeof decoded.role === 'string') {
        roles = [decoded.role];
      } else if (Array.isArray(decoded.role)) {
        roles = decoded.role;
      }
      
      // Check if user has Admin role
      if (!roles.includes('Admin')) {
        // User doesn't have Admin role, redirect to access denied
        const accessDeniedUrl = new URL('/auth/access', request.url);
        return NextResponse.redirect(accessDeniedUrl);
      }
    } catch (error) {
      // Token parsing failed, redirect to login
      const loginUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // If user is authenticated and tries to access login, redirect to dashboard
  if (token && pathname === '/auth/login') {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }
  
  return NextResponse.next();
}

// Match all routes except static files, api routes, etc.
export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. .*\\..* (files with extensions - static files)
     * 4. /favicon.ico (favicon file)
     */
    '/((?!api|_next|.*\\..*|favicon.ico).*)',
  ],
};