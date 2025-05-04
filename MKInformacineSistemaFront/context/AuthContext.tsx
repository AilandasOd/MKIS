'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
// Import jwt-decode correctly
import { jwtDecode } from "jwt-decode";

type UserRole = 'Admin' | 'User' | 'Hunter';

interface JwtPayload {
  role?: string[] | string;
  sub?: string;
  name?: string;
  exp?: number;
}

type AuthContextType = {
  isAuthenticated: boolean;
  userRoles: UserRole[];
  userName: string;
  userId: string;
  login: (token: string) => void;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userRoles: [],
  userName: '',
  userId: '',
  login: () => {},
  logout: () => {},
  hasRole: () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  // Parse JWT token to extract role information
  const parseToken = (token: string) => {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      
      // Extract roles from token
      let roles: string[] = [];
      if (typeof decoded.role === 'string') {
        roles = [decoded.role];
      } else if (Array.isArray(decoded.role)) {
        roles = decoded.role;
      }
      
      // Map to our UserRole type and filter out any invalid roles
      const validRoles = roles
        .map(role => role as UserRole)
        .filter(role => role === 'Admin' || role === 'User' || role === 'Hunter');
      
      setUserRoles(validRoles);
      setUserName(decoded.name || '');
      setUserId(decoded.sub || '');
      
      // Check if token is expired
      const currentTime = Date.now() / 1000;
      if (decoded.exp && decoded.exp < currentTime) {
        console.warn('Token expired');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to parse JWT token:', error);
      return false;
    }
  };

  // Check for existing token on initial load
  useEffect(() => {
    const checkAuth = () => {
      const token = sessionStorage.getItem("accessToken");
      if (token && parseToken(token)) {
        setIsAuthenticated(true);
      } else if (token) {
        // Token exists but is invalid
        sessionStorage.removeItem("accessToken");
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Handle redirects when auth state or path changes
  useEffect(() => {
    // Skip during initial loading or hydration
    if (isLoading) return;

    // Protected routes that require authentication
    const isProtectedRoute = 
      pathname.startsWith('/dashboard') || 
      pathname.startsWith('/members') ||
      pathname.startsWith('/statistics') ||
      pathname.startsWith('/tests') ||
      pathname.startsWith('/maps') ||
      pathname.startsWith('/post') ||
      pathname.startsWith('/drivenhunts') ||
      pathname.startsWith('/uikit');
                            
    // Admin-only routes
    const isAdminRoute = pathname.startsWith('/admin');
    
    // Auth routes like login, register
    const isAuthRoute = pathname === '/auth/login';
    
    // Public routes available to everyone
    const isPublicRoute = pathname === '/' || pathname === '/landing';
    
    // Redirect unauthenticated users away from protected routes
    if ((isProtectedRoute || isAdminRoute) && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    // Check if user has Admin role for admin routes
    if (isAdminRoute && !userRoles.includes('Admin')) {
      console.warn('Access denied: Admin role required');
      router.push('/auth/access'); // Redirect to access denied page
      return;
    }
    
    // Redirect authenticated users trying to access login
    if (isAuthRoute && isAuthenticated) {
      router.push('/dashboard');
    }

  }, [pathname, isAuthenticated, userRoles, router, isLoading]);

  // Check if user has a specific role
  const hasRole = (role: UserRole) => {
    return userRoles.includes(role);
  };

  const login = (token: string) => {
    if (parseToken(token)) {
      sessionStorage.setItem("accessToken", token);
      setIsAuthenticated(true);
      router.push('/dashboard');
    } else {
      console.error("Invalid token received");
      sessionStorage.removeItem("accessToken");
      setIsAuthenticated(false);
    }
  };

  const logout = () => {
    // Call logout endpoint to invalidate session on server
    fetch('https://localhost:7091/api/logout', {
      method: 'POST',
      credentials: 'include'
    }).catch(err => {
      console.error("Error during logout:", err);
    }).finally(() => {
      // Always clear local session data regardless of backend response
      sessionStorage.removeItem("accessToken");
      setIsAuthenticated(false);
      setUserRoles([]);
      setUserName('');
      setUserId('');
      router.push('/auth/login');
    });
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      userRoles, 
      userName, 
      userId, 
      login, 
      logout, 
      hasRole 
    }}>
      {isLoading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);