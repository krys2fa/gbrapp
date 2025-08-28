"use client";

import { useState } from "react";
import { useAuth } from "../context/auth-context";
import Image from "next/image";
import { AtSign, Key, Loader2, Shield, User, Mail } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      await login(email, password);
      // Redirect is handled in the auth context
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(errorMessage);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Form (2/3 width on large screens) */}
      <div className="flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24 w-full lg:w-2/3">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="mb-10 ">
            <div className="flex justify-center mb-6 bg-black">
              <Image
                src="/goldbod-logo.webp"
                alt="GBR Logo"
                width={120}
                height={120}
                className="h-30 w-auto"
                priority
              />
            </div>
            <h2 className="mt-8 text-2xl font-bold leading-9 tracking-tight text-gray-900 text-center">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500 text-center">
              Enter your credentials to access the system
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="flex items-center gap-2 text-sm font-medium leading-6 text-gray-900"
              >
                <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                Email address
              </label>
              <div className="relative mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-md border-0 py-1.5 pl-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="admin@gbrapp.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="flex items-center gap-2 text-sm font-medium leading-6 text-gray-900"
              >
                <Key className="h-5 w-5 text-gray-400" aria-hidden="true" />
                Password
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 focus:outline-none"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="#"
                  className="font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Demo Credentials (1/3 width on large screens) */}
      <div className="relative hidden lg:flex w-0 lg:w-1/3 flex-1">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-yellow-600 to-yellow-800 flex flex-col items-center justify-center">
          <div className="text-center px-8">
            {/* <div className="flex justify-center mb-8">
              <Image
                src="/goldbod-logo.webp"
                alt="GBR Logo"
                width={150}
                height={150}
                className="h-auto w-auto"
                priority
              />
            </div> */}
            {/* <h1 className="text-4xl font-bold text-white mb-6">
              GBR Management System
            </h1> */}
            {/* <p className="text-xl text-yellow-100 max-w-md mx-auto mb-8">
              A comprehensive platform for managing gold buying and refining
              operations
            </p> */}

            {/* Login Credentials Section */}
            <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 max-w-sm mx-auto">
              <h3 className="text-lg font-semibold text-white mb-4">
                Demo Login Credentials
              </h3>
              <div className="space-y-4 text-left">
                <div className="bg-white/10 rounded-md p-3 flex items-center gap-3">
                  <Shield
                    className="h-5 w-5 text-yellow-400"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium text-yellow-200">
                      Super Administrator
                    </p>
                    <p className="text-xs text-white mt-1">
                      Email: superadmin@gbrapp.com
                    </p>
                    <p className="text-xs text-white">
                      Password: superadmin123
                    </p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-md p-3 flex items-center gap-3">
                  <User
                    className="h-5 w-5 text-yellow-400"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium text-yellow-200">
                      Administrator
                    </p>
                    <p className="text-xs text-white mt-1">
                      Email: admin@gbrapp.com
                    </p>
                    <p className="text-xs text-white">Password: admin123</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
