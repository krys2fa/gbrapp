"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  X,
  Settings,
  ChevronRight,
  FileText,
  Award,
  CreditCard,
  Activity,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { Button } from "@/app/components/ui/button";
import { useAuth } from "@/app/context/auth-context";
import { LogoutButton } from "@/app/components/auth/logout-button";

interface SidebarProps {
  children?: React.ReactNode;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  href,
  isActive,
  onClick,
}) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group",
        isActive
          ? "bg-[#2e7030] text-white border-l-4 border-amber-500 shadow-md"
          : "text-white hover:text-white/90 hover:bg-[#2e7030]"
      )}
    >
      <div
        className={cn(
          "transition-transform duration-200",
          isActive ? "text-amber-400" : "text-white/90 group-hover:text-white"
        )}
      >
        {icon}
      </div>
      <span className="font-medium">{label}</span>
      <ChevronRight
        className={cn(
          "ml-auto h-4 w-4 transition-transform duration-200",
          isActive ? "text-amber-400" : "text-white/80 group-hover:text-white"
        )}
      />
    </Link>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const navigation = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: <Activity className="h-5 w-5" />,
    },
    {
      id: "job-cards",
      label: "Job Cards",
      href: "/job-cards",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: "valuations",
      label: "Valuations",
      href: "/valuations",
      icon: <ClipboardCheck className="h-5 w-5" />,
    },
    {
      id: "payment-receipting",
      label: "Payment & Receipting",
      href: "/payment-receipting",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      id: "sealing-certification",
      label: "Sealing & Certification",
      href: "/sealing-certification",
      icon: <Award className="h-5 w-5" />,
    },
    {
      id: "reports",
      label: "Reports",
      href: "/reports",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: "settings",
      label: "Settings",
      href: "/setup",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  // Role-based navigation filtering
  const getFilteredNavigation = () => {
    if (!user?.role) return navigation;

    switch (user.role) {
      case "FINANCE":
        return navigation.filter(
          (item) => item.id === "dashboard" || item.id === "reports"
        );
      case "TELLER":
        return navigation.filter(
          (item) => item.id === "dashboard" || item.id === "payment-receipting"
        );
      default:
        return navigation;
    }
  };

  const filteredNavigation = getFilteredNavigation();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="lg:flex lg:h-screen lg:overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-amber-500/20 dark:border-amber-500/10">
        <div className="flex items-center justify-between px-4 py-3">
          {/* <div className="flex items-center gap-3"> */}
          <div className="bg-[#27562a] flex items-center gap-3 px-6 py-3 rounded-md border border-amber-500/30">
            <div className="relative w-64 h-12">
              <Image
                src="/goldbod-logo.webp"
                alt="GBR Logo"
                fill
                className="object-contain bg-[#27562a]"
              />
            </div>
          </div>
          {/* <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              GBR App
            </h1> */}
          {/* </div> */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="lg:hidden"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "lg:flex-shrink-0 lg:h-screen lg:overflow-y-auto bg-[#27562a] dark:bg-[#27562a] border-r border-gray-200 dark:border-gray-700",
          "lg:relative lg:z-auto lg:translate-x-0",
          "fixed top-0 left-0 z-40 h-full transition-transform duration-300 ease-in-out overflow-y-auto",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
          "w-72 lg:w-64 xl:w-72 2xl:w-80"
        )}
      >
        {/* Desktop Header */}
        <div className="bg-[#27562a] hidden lg:flex items-center py-3 border-b border-amber-500/30 dark:border-amber-500/20">
          {/* <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg border border-amber-500/30"></div> */}
          {/* <div> */}
          {/* <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              GBR App
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Management System
            </p> */}
          <div className="relative w-full h-16">
            <Image
              src="/goldbod-logo.webp"
              alt="GBR Logo"
              fill
              className="object-contain mx-auto"
            />
          </div>
          {/* </div> */}
        </div>

        {/* Navigation */}
        {/* Mobile Menu Logo - Only visible when mobile menu is open */}
        <nav className="p-4 xl:p-6 space-y-2 mt-16 lg:mt-0">
          <div className="bg-[#27562a] flex justify-center mb-6 lg:hidden p-4 rounded-lg border border-amber-500/30">
            {/* <div> */}
            <div className="relative w-[120px] h-10">
              <Image
                src="/goldbod-logo.webp"
                alt="GBR Logo"
                fill
                className="object-contain"
              />
            </div>
            {/* </div> */}
          </div>
          <div className="mb-4 lg:mb-6">
            <h2 className="text-xs font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-3 px-4">
              Main Menu
            </h2>
            <div className="space-y-1">
              {filteredNavigation.map((item) => (
                <NavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  isActive={
                    pathname === item.href ||
                    pathname?.startsWith(`${item.href}/`)
                  }
                  onClick={handleNavClick}
                />
              ))}
            </div>
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-amber-500/20">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#2e7030] transition-colors">
            <div className="w-10 h-10 bg-[#27562a] border border-amber-500/40 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user?.name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || "Loading..."}
              </p>
              <p className="text-xs text-white/80 truncate">
                {user?.email || "user@example.com"}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:flex-1 lg:overflow-auto lg:h-screen bg-gray-50 dark:bg-gray-950">
        <div className="pt-16 lg:pt-0 min-h-full lg:min-h-screen">
          {children}
        </div>
      </div>
    </div>
  );
};
