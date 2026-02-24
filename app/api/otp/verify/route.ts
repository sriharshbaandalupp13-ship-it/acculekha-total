import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  phone: z.string().min(10),
  code: z.string().length(6)
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const latest = await db.otpCode.findFirst({
    where: { phone: parsed.data.phone, used: false },
    orderBy: { createdAt: "desc" }
  });

  if (!latest) return NextResponse.json({ ok: false }, { status: 400 });
  if (latest.expiresAt < new Date()) return NextResponse.json({ ok: false, error: "Expired" }, { status: 400 });

  const ok = await bcrypt.compare(parsed.data.code, latest.codeHash);
  if (!ok) return NextResponse.json({ ok: false }, { status: 400 });

  await db.otpCode.update({ where: { id: latest.id }, data: { used: true } });
  return NextResponse.json({ ok: true });
}
