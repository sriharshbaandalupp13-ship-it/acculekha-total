import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const orderSchema = z.object({
  customer: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.string().min(5),
  gstin: z.string().optional(),
  paymentMode: z.enum(["online", "cod"]),
  lines: z.array(z.object({ productId: z.string(), qty: z.number().int().positive() })).min(1)
});

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orders = await db.order.findMany({
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const ids = parsed.data.lines.map((l) => l.productId);
  const products = await db.product.findMany({ where: { id: { in: ids }, enabled: true, inStock: true } });
  if (products.length !== ids.length) return NextResponse.json({ error: "Some products unavailable" }, { status: 400 });

  let subtotal = 0;
  const itemData = parsed.data.lines.map((line) => {
    const p = products.find((x) => x.id === line.productId)!;
    const price = p.price;
    subtotal += price * line.qty;
    return { productId: p.id, qty: line.qty, price };
  });

  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;
  const orderNo = `ACL-${Date.now().toString().slice(-6)}`;

  const order = await db.order.create({
    data: {
      orderNo,
      customer: parsed.data.customer,
      email: parsed.data.email,
      phone: parsed.data.phone,
      address: parsed.data.address,
      gstin: parsed.data.gstin,
      paymentMode: parsed.data.paymentMode,
      subtotal,
      gst,
      total,
      items: { create: itemData }
    },
    include: { items: true }
  });

  return NextResponse.json(order, { status: 201 });
}
