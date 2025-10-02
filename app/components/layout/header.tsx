"use client";

import React from "react";
import Link from "next/link";
import { Search, Bell, User, Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";

interface HeaderProps {
  title?: string;
  className?: string;
  // optional hero icon and subtitle to show a page descriptor
  icon?: React.ReactNode;
  subtitle?: string;
  // optional background class for the icon container
  iconBgClass?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title = "Dashboard",
  className,
  icon,
  subtitle,
  iconBgClass,
}) => {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const pathname = usePathname();
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement | null>(null);

  // const notifications = [
  //   {
  //     id: "n1",
  //     title: "Job Card Created",
  //     description: "New job card for Exporter ABC has been created.",
  //     time: "30 minutes ago",
  //   },
  //   {
  //     id: "n2",
  //     title: "Invoice Generated",
  //     description: "Invoice #INV-2025-042 generated for Exporter XYZ.",
  //     time: "2 hours ago",
  //   },
  //   {
  //     id: "n3",
  //     title: "Payment Received",
  //     description: "Payment of $15,000 received from Global Exports.",
  //     time: "6 hours ago",
  //   },
  // ];

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsNotifOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 bg-[#d4af37] border-b border-amber-500/30 no-print",
        className
      )}
    >
      <div className="flex items-center justify-between px-6 lg:px-8 py-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {icon ? (
            <div className="flex items-center gap-4">
              <div
                className={`${
                  iconBgClass || "bg-[#d4af37]"
                } w-12 h-12 rounded-full flex items-center justify-center text-white`}
                style={iconBgClass ? undefined : { backgroundColor: "#d4af37" }}
              >
                {icon}
              </div>
              <div>
                <h1 className="text-2xl xl:text-3xl font-bold text-white">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-white/90">{subtitle}</p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl xl:text-3xl font-bold text-white">
                {title}
              </h1>
              <p className="text-sm text-white/90">
                {/* Welcome back! Here's what's happening today. */}
              </p>
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-xl text-white hover:bg-white/10"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-white" />
            ) : (
              <Moon className="h-5 w-5 text-white" />
            )}
          </Button>

          {/* Notifications */}
          {/* <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl relative text-white hover:bg-white/10"
              onClick={() => setIsNotifOpen((s) => !s)}
              aria-expanded={isNotifOpen}
              aria-haspopup="true"
            >
              <Bell className="h-5 w-5 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] text-white font-medium">
                  {notifications.length}
                </span>
              </div>
            </Button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                      Notifications
                    </span>
                    <button
                      onClick={() => setIsNotifOpen(false)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 hover:bg-gray-50 dark:hover:bg-gray-900 border-b last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {n.description}
                          </p>
                        </div>
                        <div className="text-xs text-gray-400">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 text-center">
                  <a
                    href="/notifications"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View all
                  </a>
                </div>
              </div>
            )}
          </div> */}

          {/* Profile */}
          <Link href="/settings">
            <Button
              variant="ghost"
              className="flex items-center gap-2 rounded-xl px-3 text-white hover:bg-white/10"
            >
              <div className="w-8 h-8 bg-[#d4af37] rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="hidden md:block text-sm font-medium text-white">
                Profile
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
