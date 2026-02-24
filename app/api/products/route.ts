import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureBootstrap } from "@/lib/bootstrap";
import { requireAdmin } from "@/lib/auth";

const productSchema = z.object({
  slug: z.string().min(2),
  name: z.string().min(2),
  cat: z.enum(["software", "hardware", "iot", "service", "bundle"]),
  description: z.string().min(2),
  unit: z.string().min(1),
  price: z.number().int().nonnegative(),
  origPrice: z.number().int().nonnegative().nullable().optional(),
  gstRate: z.number().int().min(0).max(100),
  inStock: z.boolean(),
  enabled: z.boolean(),
  isNew: z.boolean(),
  offer: z.string().nullable().optional(),
  image1: z.string().nullable().optional(),
  image2: z.string().nullable().optional(),
  image3: z.string().nullable().optional(),
  image4: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional()
});

export async function GET() {
  await ensureBootstrap();
  const products = await db.product.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const created = await db.product.create({ data: parsed.data });
  return NextResponse.json(created, { status: 201 });
}
