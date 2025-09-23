import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logger, LogLevel, LogCategory } from "@/lib/logger";

// Simple shared-secret guard to prevent external abuse
const INTERNAL_LOG_SECRET =
  process.env.INTERNAL_LOG_SECRET || "dev-internal-secret";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-internal-log-secret");
    if (!secret || secret !== INTERNAL_LOG_SECRET) {
      await logger.warn(
        LogCategory.SECURITY,
        "Rejected internal log request due to invalid secret"
      );
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      level = "INFO",
      category = "SYSTEM",
      message = "",
      metadata = {},
    } = body as any;

    // Normalize category to known enum where possible
    const cat = (LogCategory as any)[category] || LogCategory.SYSTEM;
    const lvl = (LogLevel as any)[level] || LogLevel.INFO;

    // Use the server logger to persist the entry (file + DB)
    await logger.log({
      level: lvl,
      category: cat,
      message: typeof message === "string" ? message : JSON.stringify(message),
      metadata,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    await logger.error(LogCategory.SYSTEM, "Internal log route error", {
      error: String(err),
    });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
