import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const inquirySchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  city: z.string().optional(),
  message: z.string().optional(),
  productId: z.string().optional()
});

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const inquiries = await db.inquiry.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(inquiries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const inquiry = await db.inquiry.create({ data: parsed.data });
  return NextResponse.json(inquiry, { status: 201 });
}
