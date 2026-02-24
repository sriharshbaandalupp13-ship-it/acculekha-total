import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createAdminToken, setAdminCookie } from "@/lib/auth";
import { ensureBootstrap } from "@/lib/bootstrap";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(req: NextRequest) {
  await ensureBootstrap();
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const token = createAdminToken(user.email);
  await setAdminCookie(token);
  return NextResponse.json({ ok: true });
}
