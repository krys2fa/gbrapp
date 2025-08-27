"use client";

import { useAuth } from "@/app/context/auth-context";
import { LogOut } from "lucide-react";
import { useState } from "react";

export function LogoutButton() {
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      // Call logout API endpoint
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Client-side logout
      logout();
    } catch (error) {
      console.error("Logout error:", error);
      // Still attempt to log out on the client side
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
    >
      <LogOut className="h-5 w-5" />
      <span>{isLoading ? "Logging out..." : "Logout"}</span>
    </button>
  );
}
