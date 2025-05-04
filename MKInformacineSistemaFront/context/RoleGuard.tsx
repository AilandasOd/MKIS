'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

type UserRole = 'Admin' | 'User' | 'Hunter';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRoles: UserRole[];
}

/**
 * A component that checks if the user has the required roles
 * If not, redirects to the access denied page
 */
const RoleGuard: React.FC<RoleGuardProps> = ({ children, requiredRoles }) => {
  const { isAuthenticated, userRoles } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if the user is authenticated
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Check if the user has any of the required roles
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      router.push('/auth/access');
    }
  }, [isAuthenticated, userRoles, requiredRoles, router]);

  // If user doesn't have required roles, don't render children
  if (!isAuthenticated || !requiredRoles.some(role => userRoles.includes(role))) {
    return null; // or a loading indicator
  }

  // User has at least one of the required roles, render children
  return <>{children}</>;
};

export default RoleGuard;