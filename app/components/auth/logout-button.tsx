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
      className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-amber-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
      title="Logout"
    >
      <LogOut className="h-4 w-4" />
      <span className="sr-only">{isLoading ? "Logging out..." : "Logout"}</span>
    </button>
  );
}
