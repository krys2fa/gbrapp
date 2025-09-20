"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "@/app/context/auth-context";
import {
  getDefaultRouteForRole,
  type UserRole,
} from "@/app/lib/role-permissions";

export default function UnauthorizedPage() {
  const { user } = useAuth();

  const getDefaultRoute = () => {
    if (user?.role) {
      return getDefaultRouteForRole(user.role as UserRole);
    }
    return "/dashboard";
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "EXECUTIVE":
        return "Executive";
      case "FINANCE":
        return "Finance";
      case "ADMIN":
        return "Administrator";
      case "SMALL_SCALE_ASSAYER":
        return "Small Scale Assayer";
      case "LARGE_SCALE_ASSAYER":
        return "Large Scale Assayer";
      case "SUPERADMIN":
        return "Super Administrator";
      default:
        return role;
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <div className="bg-red-100 p-4 rounded-full">
            <ShieldAlert className="h-16 w-16 text-red-600" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900">Access Denied</h1>

        {user && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              You are logged in as{" "}
              <span className="font-medium text-gray-900">{user.name}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Role: {getRoleDisplayName(user.role)}
            </p>
          </div>
        )}

        <div className="mt-4">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="mx-auto">
                <h3 className="text-sm font-medium text-red-800">
                  You don&apos;t have permission to access this page.
                </h3>
                <p className="mt-2 text-sm text-red-700">
                  You can only access pages that are authorized for your role.
                  Please contact your administrator if you believe this is an
                  error.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 sm:justify-center">
          <Link
            href={getDefaultRoute()}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
