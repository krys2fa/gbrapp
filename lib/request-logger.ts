// lib/request-logger.ts
import { NextRequest, NextResponse } from "next/server";
import { logger, LogCategory, LogLevel } from "./logger";

export interface RequestLogData {
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  requestId: string;
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function logRequest(
  req: NextRequest,
  response: NextResponse,
  duration: number,
  requestId: string,
  userId?: string,
  userName?: string,
  userRole?: string
): Promise<void> {
  const logData: RequestLogData = {
    method: req.method,
    url: req.url,
    statusCode: response.status,
    duration,
    userAgent: req.headers.get("user-agent") || undefined,
    ipAddress:
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      undefined,
    userId,
    userName,
    userRole,
    requestId,
  };

  const level =
    response.status >= 500
      ? LogLevel.ERROR
      : response.status >= 400
      ? LogLevel.WARN
      : LogLevel.INFO;

  const message = `${req.method} ${req.url} - ${response.status} (${duration}ms)`;

  await logger.log({
    level,
    category: LogCategory.API,
    message,
    userId,
    userName,
    userRole,
    ipAddress: logData.ipAddress,
    userAgent: logData.userAgent,
    requestId,
    metadata: {
      method: req.method,
      url: req.url,
      statusCode: response.status,
      duration,
    },
  });
}

// Wrapper function for API routes
export function withRequestLogging(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = generateRequestId();

    // Add request ID to headers for tracking
    req.headers.set("x-request-id", requestId);

    try {
      const response = await handler(req, ...args);
      const duration = Date.now() - startTime;

      // Log the request (we'll extract user info from JWT if available)
      await logRequest(req, response, duration, requestId);

      // Add request ID to response headers
      response.headers.set("x-request-id", requestId);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );

      await logger.error(
        LogCategory.API,
        `API Error: ${req.method} ${req.url}`,
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          duration,
          requestId,
        }
      );

      await logRequest(req, errorResponse, duration, requestId);

      errorResponse.headers.set("x-request-id", requestId);
      return errorResponse;
    }
  };
}
