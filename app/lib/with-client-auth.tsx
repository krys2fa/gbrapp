'use client';

import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export interface WithAuthOptions {
  requiredRoles?: string[];
  redirectTo?: string;
}

/**
 * Higher-order component for protecting client-side routes
 * 
 * @param Component The component to wrap
 * @param options Configuration options
 * @returns Protected component
 */
export function withClientAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const { requiredRoles = [], redirectTo = '/login' } = options;
  
  function ProtectedComponent(props: P) {
    const { isAuthenticated, hasRole, isLoading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
      if (!isLoading) {
        if (!isAuthenticated) {
          router.push(redirectTo);
          return;
        }
        
        if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
          router.push('/unauthorized');
          return;
        }
      }
    }, [isLoading, isAuthenticated, router]);
    
    if (isLoading) {
      return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }
    
    if (!isAuthenticated) {
      return null; // Will be redirected by the useEffect
    }
    
    if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
      return null; // Will be redirected by the useEffect
    }
    
    return <Component {...props} />;
  }
  
  return ProtectedComponent;
}
