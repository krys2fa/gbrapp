"use client";

import { ReactNode, useEffect } from "react";
import { Sidebar } from "@/app/components/layout/sidebar";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/app/context/auth-context";
import { getDefaultRouteForRole } from "@/app/lib/role-permissions";

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!searchParams) return;

    // Handle middleware-added unauthorized query param
    if (searchParams.get("unauthorized") === "true") {
      const role = user?.role;
      const defaultRoute = role
        ? getDefaultRouteForRole(role as any)
        : "/dashboard";
      toast.error(
        "You don't have permission to access that page. Redirected to your default page.",
        { id: "unauthorized-redirect" }
      );

      // Replace the URL to remove the query param without adding history entry
      try {
        router.replace(pathname || defaultRoute);
      } catch (e) {
        /* ignore */
      }

      return;
    }

    if (searchParams.get("inactive") === "true") {
      toast.error(
        "Your account is inactive. Please contact an administrator.",
        {
          id: "inactive-account",
        }
      );
      try {
        router.replace(pathname || "/login");
      } catch (e) {
        /* ignore */
      }
      return;
    }
  }, [searchParams, router, pathname, user]);

  // Don't show sidebar on login or unauthorized pages
  const hideSidebar =
    (pathname &&
      (pathname.includes("/login") || pathname.includes("/unauthorized"))) ||
    false;

  if (hideSidebar) {
    return <>{children}</>;
  }

  return <Sidebar>{children}</Sidebar>;
}
