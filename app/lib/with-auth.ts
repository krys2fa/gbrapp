import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { Role } from '@/app/generated/prisma';

interface DecodedToken {
  userId: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
}

/**
 * Higher-order function that wraps API route handlers to add authentication and authorization
 * 
 * @param handler The original route handler
 * @param requiredRoles Array of roles allowed to access the route (empty means any authenticated user)
 * @returns The wrapped route handler with auth protection
 */
export function withAuth<T = any>(
  handler: (req: NextRequest, params: { params: T; user: DecodedToken }) => Promise<NextResponse>,
  requiredRoles: Role[] = []
) {
  return async (req: NextRequest, params: { params: T }) => {
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development-only';
    
    // Extract token from Authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No valid token provided' }, { status: 401 });
    }
    
    try {
      // Verify the token
      const token = authHeader.substring(7);
      const decoded = verify(token, JWT_SECRET) as DecodedToken;
      
      // Check if token has required role (if roles are specified)
      if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
        return NextResponse.json({ 
          error: 'Forbidden - Insufficient permissions',
          requiredRoles,
          userRole: decoded.role,
        }, { status: 403 });
      }
      
      // Call the original handler with user info
      return handler(req, { ...params, user: decoded });
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      if (error.name === 'TokenExpiredError') {
        return NextResponse.json({ error: 'Unauthorized - Token expired' }, { status: 401 });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
      }
      
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  };
}
