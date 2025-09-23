import { NextResponse } from "next/server";
import { GET as dashboardStatsGET } from "@/app/api/dashboard/stats/route";

export async function GET(req: Request) {
  // Proxy to the existing dashboard stats handler so devs can hit /api/debug/dashboard-stats
  try {
    // The existing dashboardStatsGET expects a NextRequest; convert minimally by casting
    // This is a dev-only helper and kept intentionally simple.
    const res = await dashboardStatsGET(req as any);
    // If the original returned a NextResponse, just return it; otherwise wrap in NextResponse
    if (res instanceof NextResponse) return res;
    return NextResponse.json(res);
  } catch (err) {
    console.error("debug/dashboard-stats proxy failed", err);
    return NextResponse.json({ error: "debug proxy failed" }, { status: 500 });
  }
}
