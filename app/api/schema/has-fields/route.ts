import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const model = url.searchParams.get("model") || "JobCard";
    const fieldsQ = url.searchParams.get("fields") || "";
    const fields = fieldsQ
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    const schemaPath = path.resolve(process.cwd(), "prisma", "schema.prisma");
    const text = await fs.readFile(schemaPath, "utf-8");

    // Find model block and search for fields
    const modelRegex = new RegExp(
      `model\\s+${model}\\s+\\{([\\s\\S]*?)\\n\\}`,
      "i"
    );
    const match = modelRegex.exec(text);
    const modelBody = match ? match[1] : text;

    const result: Record<string, boolean> = {};
    for (const f of fields) {
      const re = new RegExp(`\\b${f}\\b\\s+`, "i");
      result[f] = re.test(modelBody);
    }

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
