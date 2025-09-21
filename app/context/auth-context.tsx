"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // On mount, ask server for current user via /api/auth/me using cookie-based auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (typeof window === "undefined") return;

        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!response.ok) {
          // Not authenticated
          setUser(null);
          setToken(null);
          // Clear localStorage fallback
          localStorage.removeItem("auth-token");
          localStorage.removeItem("auth-user");
          return;
        }

        const data = await response.json();
        if (data && data.success && data.user) {
          setUser(data.user);
          // Keep token in memory only if present in localStorage for legacy
          const storedToken = localStorage.getItem("auth-token");
          if (storedToken) setToken(storedToken);
          // Sync localStorage user for compatibility
          localStorage.setItem("auth-user", JSON.stringify(data.user));
        } else {
          setUser(null);
          setToken(null);
          localStorage.removeItem("auth-token");
          localStorage.removeItem("auth-user");
        }
      } catch (error) {
        console.error("Auth validation error:", error);
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Important: include cookies
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }

      const data = await response.json();

      // Store user in state; server sets httpOnly cookie for auth
      setUser(data.user);

      // Keep token in memory only for legacy flows
      if (data.token) {
        setToken(data.token);
        localStorage.setItem("auth-token", data.token);
      }

      // Sync localStorage user for compatibility
      localStorage.setItem("auth-user", JSON.stringify(data.user));

      // Navigate to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Clear state
    setUser(null);
    setToken(null);

    // Clear localStorage
    localStorage.removeItem("auth-token");
    localStorage.removeItem("auth-user");

    // Clear cookie
    document.cookie = "auth-token=; path=/; max-age=0";

    // Redirect to login
    router.push("/login");
  };

  // Check if user has any of the specified roles
  const hasRole = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
