import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
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

  const apiKey = process.env.FAST2SMS_API_KEY;
  if (apiKey) {
    try {
      // Extract last 10 digits of phone for Fast2SMS
      const phone = parsed.data.phone.replace(/\D/g, "").slice(-10);
      const message = `Your Acculekhaa OTP is ${code}. Valid for 5 minutes. Do not share this OTP with anyone.`;
      const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=q&message=${encodeURIComponent(message)}&language=english&flash=0&numbers=${phone}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.return) {
        console.error("Fast2SMS error:", data);
      }
    } catch (err) {
      console.error("Fast2SMS send failed:", err);
    }
  }

  return NextResponse.json({
    ok: true,
    // Only expose OTP in development/non-production for demo
    demoOtp: process.env.NODE_ENV !== "production" ? code : undefined
  });
}
