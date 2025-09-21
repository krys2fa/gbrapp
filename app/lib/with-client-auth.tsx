"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/context/auth-context";
import {
  hasPermission,
  getModuleFromRoute,
  getDefaultRouteForRole,
  type UserRole,
  type PermissionModule,
} from "@/app/lib/role-permissions";
import toast from "react-hot-toast";
import { evaluateRedirect } from "@/app/lib/auth-utils";

/**
 * Higher-order component for client-side route protection
 *
 * @param Component The component to wrap with authentication
 * @param requiredPermissions Optional array of permission modules required to access the component
 * @returns A new component with authentication logic
 */
export function withClientAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: PermissionModule[] = []
) {
  return function ProtectedRoute(props: P) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      let redirectTimeout: NodeJS.Timeout;

      // If still loading, don't do anything yet
      if (isLoading) return;

      // Only redirect if not loading and not authenticated
      if (!isAuthenticated) {
        // Add a small delay to ensure state is fully updated
        redirectTimeout = setTimeout(() => {
          router.push("/login");
        }, 300);
        return;
      }

      // Check permissions if needed or infer from current route
      if (isAuthenticated && user) {
        const userRole = user.role as UserRole;

        // If explicit required permissions provided, enforce them
        if (requiredPermissions.length > 0) {
          const hasRequiredPermission = requiredPermissions.some((permission) =>
            hasPermission(userRole, permission)
          );

          if (!hasRequiredPermission) {
            const evalRes = evaluateRedirect(
              userRole,
              pathname || "",
              requiredPermissions
            );
            if (evalRes.shouldRedirect) {
              if (evalRes.message)
                toast.error(evalRes.message, { id: "auth-redirect" });
              redirectTimeout = setTimeout(() => {
                router.push(evalRes.redirectTo || "/dashboard");
              }, 300);
            }
          }
        } else {
          // No explicit requiredPermissions: infer module from pathname and enforce
          try {
            const currentPath =
              pathname ||
              (typeof window !== "undefined" ? window.location.pathname : "");
            const module = getModuleFromRoute(currentPath || "");
            if (module && !hasPermission(userRole, module)) {
              const evalRes = evaluateRedirect(userRole, currentPath || "");
              if (evalRes.shouldRedirect) {
                if (evalRes.message)
                  toast.error(evalRes.message, { id: "auth-redirect" });
                redirectTimeout = setTimeout(() => {
                  router.push(evalRes.redirectTo || "/dashboard");
                }, 300);
              }
            }
          } catch (e) {
            // If anything goes wrong during inference, be conservative and allow access
            // (do not block rendering due to inference errors)
            /* intentionally empty */
          }
        }
      }

      return () => {
        if (redirectTimeout) clearTimeout(redirectTimeout);
      };
    }, [isLoading, isAuthenticated, router, user]);

    // Show nothing while loading or redirecting
    if (isLoading || !isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    // If we have permission requirements and the user doesn't match, don't render
    if (requiredPermissions.length > 0 && user) {
      const userRole = user.role as UserRole;
      const hasRequiredPermission = requiredPermissions.some((permission) =>
        hasPermission(userRole, permission)
      );

      if (!hasRequiredPermission) {
        return null;
      }
    }

    // All checks passed, render the protected component
    return <Component {...props} />;
  };
}
