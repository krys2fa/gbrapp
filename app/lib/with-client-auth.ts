'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';
import { Role } from '@/app/generated/prisma';

/**
 * Higher-order component for client-side route protection
 * 
 * @param Component The component to wrap with authentication
 * @param requiredRoles Optional array of roles required to access the component
 * @returns A new component with authentication logic
 */
export function withClientAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles: Role[] = []
) {
  return function ProtectedRoute(props: P) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
      let redirectTimeout: NodeJS.Timeout;
      
      // If still loading, don't do anything yet
      if (isLoading) return;
      
      // Only redirect if not loading and not authenticated
      if (!isAuthenticated) {
        // Add a small delay to ensure state is fully updated
        redirectTimeout = setTimeout(() => {
          router.push('/login');
        }, 300);
        return;
      }

      // Check roles if needed
      if (
        isAuthenticated && 
        requiredRoles.length > 0 && 
        user && 
        !requiredRoles.includes(user.role as Role)
      ) {
        redirectTimeout = setTimeout(() => {
          router.push('/unauthorized');
        }, 300);
      }
      
      return () => {
        if (redirectTimeout) clearTimeout(redirectTimeout);
      };
    }, [isLoading, isAuthenticated, router, user, requiredRoles]);

    // Show nothing while loading or redirecting
    if (isLoading || !isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      );
    }

    // If we have role requirements and the user doesn't match, don't render
    if (
      requiredRoles.length > 0 && 
      user && 
      !requiredRoles.includes(user.role as Role)
    ) {
      return null;
    }

    // All checks passed, render the protected component
    return <Component {...props} />;
  };
}
