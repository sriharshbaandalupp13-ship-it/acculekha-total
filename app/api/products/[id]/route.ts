import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  inStock: z.boolean().optional(),
  isNew: z.boolean().optional(),
  price: z.number().int().nonnegative().optional(),
  origPrice: z.number().int().nonnegative().nullable().optional(),
  offer: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  image1: z.string().nullable().optional(),
  image2: z.string().nullable().optional(),
  image3: z.string().nullable().optional(),
  image4: z.string().nullable().optional(),
  image5: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Find product by slug (id field) or by DB id
  const existing = await db.product.findFirst({
    where: { OR: [{ id }, { slug: id }] }
  });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const updated = await db.product.update({
    where: { id: existing.id },
    data: parsed.data
  });
  return NextResponse.json(updated);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await db.product.findFirst({
    where: { OR: [{ id }, { slug: id }] }
  });
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}
