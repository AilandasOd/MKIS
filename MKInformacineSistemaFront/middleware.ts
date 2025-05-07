import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('RefreshToken')?.value;
    const { pathname } = request.nextUrl;
    
    // Define public routes that don't require authentication
    const publicRoutes = ['/auth/login', '/', '/landing', '/auth/access', '/auth/register'];
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/api/'));
    
    // Admin-only routes - will be handled by client-side RoleGuard
    const isAdminRoute = pathname.startsWith('/admin');
    
    // Protected routes (require any authentication)
    const isProtectedRoute = !isPublicRoute;
    
    // If the route is protected and there's no token, redirect to login
    if (isProtectedRoute && !token) {
      const loginUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Skip role checking in middleware for admin routes
    // Let the client-side RoleGuard handle it instead
    if (isAdminRoute) {
      return NextResponse.next();
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