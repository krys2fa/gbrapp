'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <div className="bg-red-100 p-4 rounded-full">
            <ShieldAlert className="h-16 w-16 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900">Access Denied</h1>
        
        <div className="mt-4">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="mx-auto">
                <h3 className="text-sm font-medium text-red-800">
                  You don&apos;t have permission to access this page.
                </h3>
                <p className="mt-2 text-sm text-red-700">
                  Please contact your administrator if you believe this is an error.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-center space-x-4">
          <Link
            href="/dashboard"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
          >
            Return to Dashboard
          </Link>
          
          <Link
            href="/login"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
          >
            Sign in with Different Account
          </Link>
        </div>
      </div>
    </div>
  );
}
