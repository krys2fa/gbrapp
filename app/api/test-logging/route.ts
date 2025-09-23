// app/api/test-logging/route.ts
import { NextRequest, NextResponse } from "next/server";
import { logger, LogLevel, LogCategory } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    void logger.info(
      LogCategory.SYSTEM,
      "Testing logging system via API endpoint"
    );

    // Test different log levels
    await logger.debug(LogCategory.SYSTEM, "Debug log from API test endpoint");
    await logger.info(LogCategory.API, "Info log from API test endpoint");
    await logger.warn(LogCategory.SYSTEM, "Warning log from API test endpoint");
    await logger.error(LogCategory.API, "Error log from API test endpoint");

    // Test structured logging
    await logger.log({
      level: LogLevel.INFO,
      category: LogCategory.API,
      message: "API test endpoint accessed",
      userId: "test-user",
      userName: "Test User",
      userRole: "ADMIN",
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      requestId: `test_${Date.now()}`,
      metadata: {
        endpoint: "/api/test-logging",
        method: "GET",
        timestamp: new Date().toISOString(),
        testMode: true,
      },
    });

    // Test convenience methods
    await logger.logAPI("API logging test completed successfully", {
      endpoint: "/api/test-logging",
      statusCode: 200,
    });

    return NextResponse.json({
      success: true,
      message: "Logging system test completed successfully",
      timestamp: new Date().toISOString(),
      testResults: {
        debugLog: "✅ Created",
        infoLog: "✅ Created",
        warnLog: "✅ Created",
        errorLog: "✅ Created",
        structuredLog: "✅ Created",
        convenienceMethod: "✅ Created",
      },
    });
  } catch (error) {
    await logger.error(LogCategory.API, "Logging system test failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        message: "Logging system test failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
