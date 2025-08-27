import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auditTrailMiddleware } from './app/middleware/audit-trail';

export async function middleware(request: NextRequest) {
  // Apply audit trail middleware for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return auditTrailMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply middleware to all API routes
    '/api/:path*',
  ],
};
