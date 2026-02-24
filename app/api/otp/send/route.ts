import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import twilio from "twilio";
import { db } from "@/lib/db";

const schema = z.object({ phone: z.string().min(10) });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid phone" }, { status: 400 });

  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await db.otpCode.create({
    data: { phone: parsed.data.phone, codeHash, expiresAt }
  });

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (sid && token && from) {
    const client = twilio(sid, token);
    await client.messages.create({
      to: parsed.data.phone,
      from,
      body: `Your Acculekhaa OTP is ${code}. Valid for 5 minutes.`
    });
  }

  return NextResponse.json({
    ok: true,
    demoOtp: process.env.NODE_ENV === "production" ? undefined : code
  });
}
