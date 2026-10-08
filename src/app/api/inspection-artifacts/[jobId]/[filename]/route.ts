import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import syncFs from "node:fs";
import path from "node:path";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ jobId: string; filename: string }> }
) {
  const { jobId, filename } = await context.params;

  // 1. Strict UUID validation to prevent directory traversal
  if (!/^[0-9a-fA-F-]{36}$/.test(jobId)) {
    return NextResponse.json({ error: "Invalid inspection job ID" }, { status: 400 });
  }

  // 2. Strict filename whitelist (only desktop.png and mobile.png)
  const allowedFiles = new Set(["desktop.png", "mobile.png"]);
  if (!allowedFiles.has(filename)) {
    return NextResponse.json({ error: "Invalid artifact file requested" }, { status: 404 });
  }

  // 3. Resolve path in private storage
  const filePath = path.resolve(process.cwd(), "storage/inspections", jobId, filename);

  if (!syncFs.existsSync(filePath)) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  try {
    const fileBuffer = await fs.readFile(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not read artifact file" }, { status: 500 });
  }
}
