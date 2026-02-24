import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });

  const signature = req.headers.get("x-razorpay-signature");
  const raw = await req.text();
  const expected = createHmac("sha256", secret).update(raw).digest("hex");

  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  const valid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  return NextResponse.json({ ok: true });
}
