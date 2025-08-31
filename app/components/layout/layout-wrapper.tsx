"use client";

import { ReactNode } from "react";
import { Sidebar } from "@/app/components/layout/sidebar";
import { usePathname } from "next/navigation";

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

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
