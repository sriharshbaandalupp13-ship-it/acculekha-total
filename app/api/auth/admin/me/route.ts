import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const ok = await requireAdmin();
  return NextResponse.json({ admin: ok });
}
