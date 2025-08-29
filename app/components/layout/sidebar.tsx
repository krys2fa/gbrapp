"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  X,
  LayoutDashboard,
  Settings,
  ChevronRight,
  FileText,
  ClipboardCheck,
  Award,
  CreditCard,
  Activity
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
          ? "bg-gradient-to-r from-black to-black/90 text-white border-l-4 border-amber-500 shadow-md"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
      )}
    >
      <div
        className={cn(
          "transition-transform duration-200",
          isActive
            ? "text-amber-400"
            : "text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-200"
        )}
      >
        {icon}
      </div>
      <span className="font-medium">{label}</span>
      <ChevronRight
        className={cn(
          "ml-auto h-4 w-4 transition-transform duration-200",
          isActive
            ? "text-amber-400"
            : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
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
    // {
    //   id: "evaluation",
    //   label: "Evaluation",
    //   href: "/evaluation",
    //   icon: <ClipboardCheck className="h-5 w-5" />,
    // },
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
          <div className="flex items-center gap-3">
            <div className="w-32 h-12 bg-black flex items-center justify-center border border-amber-500/30 rounded-md">
              <Image
                src="/goldbod-logo.webp"
                alt="GBR Logo"
                width={200}
                height={24}
                className="h-6"
              />
            </div>
            {/* <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              GBR App
            </h1> */}
          </div>
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
          "lg:flex-shrink-0 lg:h-screen lg:overflow-y-auto bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700",
          "lg:relative lg:z-auto lg:translate-x-0",
          "fixed top-0 left-0 z-40 h-full transition-transform duration-300 ease-in-out overflow-y-auto",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
          "w-72 lg:w-64 xl:w-72 2xl:w-80"
        )}
      >
        {/* Desktop Header */}
        <div className="bg-black hidden lg:flex items-center gap-3 px-6 py-5 border-b border-amber-500/30 dark:border-amber-500/20">
          {/* <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg border border-amber-500/30"></div> */}
          <div>
            {/* <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              GBR App
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Management System
            </p> */}
            <Image
              src="/goldbod-logo.webp"
              alt="GBR Logo"
              width={120}
              height={80}
              className="w-auto h-8 ml-10"
            />
          </div>
        </div>

        {/* Navigation */}
        {/* Mobile Menu Logo - Only visible when mobile menu is open */}
        <nav className="p-4 xl:p-6 space-y-2 mt-16 lg:mt-0">
          <div className="bg-black flex justify-center mb-6 lg:hidden p-4 rounded-lg border border-amber-500/30">
            <div>
              <Image
                src="/goldbod-logo.webp"
                alt="GBR Logo"
                width={120}
                height={40}
                className="w-auto h-10"
              />
            </div>
          </div>
          <div className="mb-4 lg:mb-6">
            <h2 className="text-xs font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-3 px-4">
              Main Menu
            </h2>
            <div className="space-y-1">
              {navigation.map((item) => (
                <NavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  isActive={
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`)
                  }
                  onClick={handleNavClick}
                />
              ))}
            </div>
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-amber-500/20 dark:border-amber-500/10">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="w-10 h-10 bg-black border border-amber-500/40 rounded-full flex items-center justify-center">
              <span className="text-amber-500 font-medium text-sm">
                {user?.name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {/* <span className="text-amber-700 dark:text-amber-500">
                  {user?.role || "User"}
                </span>{" "} */}
                {user?.name || "Loading..."}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
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
