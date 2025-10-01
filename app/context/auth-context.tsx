"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

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
  resetIdleTimer: () => void;
  getTimeUntilExpiry: () => number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Idle timeout configuration (30 minutes)
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME_MS = 5 * 60 * 1000; // Show warning 5 minutes before expiry

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [idleWarningShown, setIdleWarningShown] = useState<boolean>(false);
  const router = useRouter();

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we're on the client side
        if (typeof window === "undefined") return;

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
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth-token");
          localStorage.removeItem("auth-user");
        }
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Idle timeout management
  useEffect(() => {
    if (!user) return;

    const resetIdleTimer = () => {
      setLastActivity(Date.now());
      setIdleWarningShown(false);
    };

    const checkIdleTimeout = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      const timeUntilExpiry = IDLE_TIMEOUT_MS - timeSinceActivity;

      if (timeSinceActivity >= IDLE_TIMEOUT_MS) {
        // Idle timeout reached - logout
        toast.error("Session expired due to inactivity");
        logout();
        return;
      }

      if (timeUntilExpiry <= WARNING_TIME_MS && !idleWarningShown) {
        // Show warning 5 minutes before expiry
        const minutesLeft = Math.ceil(timeUntilExpiry / (60 * 1000));
        toast(
          `Session will expire in ${minutesLeft} minute${
            minutesLeft !== 1 ? "s" : ""
          } due to inactivity`,
          {
            duration: 5000,
          }
        );
        setIdleWarningShown(true);
      }
    };

    // Set up event listeners for user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((event) => {
      document.addEventListener(event, resetIdleTimer, true);
    });

    // Check idle timeout every minute
    const interval = setInterval(checkIdleTimeout, 60 * 1000);

    // Initial check
    checkIdleTimeout();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetIdleTimer, true);
      });
      clearInterval(interval);
    };
  }, [user, lastActivity, idleWarningShown]);

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

      // Reset idle timer on login
      setLastActivity(Date.now());
      setIdleWarningShown(false);

      // The cookie is set on the server side in the login API response
      // Client-safe logging: send a non-blocking request to the internal log endpoint
      void fetch("/api/internal/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          level: "INFO",
          category: "AUTH",
          message: "Login successful, user set",
          metadata: {
            user: data.user,
            tokenPreview: data.token.substring(0, 20) + "...",
          },
        }),
      });

      // Force a page reload to ensure the cookie is available to the middleware
      window.location.href = "/dashboard";
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Login error: ${message}`);
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

  // Reset idle timer manually
  const resetIdleTimer = () => {
    setLastActivity(Date.now());
    setIdleWarningShown(false);
  };

  // Get time until session expiry (in milliseconds)
  const getTimeUntilExpiry = () => {
    if (!user) return 0;
    const now = Date.now();
    const timeSinceActivity = now - lastActivity;
    return Math.max(0, IDLE_TIMEOUT_MS - timeSinceActivity);
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    hasRole,
    resetIdleTimer,
    getTimeUntilExpiry,
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
