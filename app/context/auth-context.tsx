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

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem("auth-token");
        const storedUser = localStorage.getItem("auth-user");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Validate token with the backend
          const response = await fetch("/api/auth/validate", {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
            credentials: "include",
          });

          if (!response.ok) {
            // If token is invalid, clear everything
            localStorage.removeItem("auth-token");
            localStorage.removeItem("auth-user");
            setUser(null);
            setToken(null);
          }
        }
      } catch (error) {
        console.error("Auth validation error:", error);
        // Clear invalid state
        localStorage.removeItem("auth-token");
        localStorage.removeItem("auth-user");
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

      // Store in state
      setUser(data.user);
      setToken(data.token);

      // Store in localStorage for persistence
      localStorage.setItem("auth-token", data.token);
      localStorage.setItem("auth-user", JSON.stringify(data.user));

      // The cookie is set on the server side in the login API response
      console.log("Login successful, user set:", data.user);
      console.log("Token stored:", data.token.substring(0, 20) + "...");

      // Force a page reload to ensure the cookie is available to the middleware
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
