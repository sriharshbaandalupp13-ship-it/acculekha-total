import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "accu_admin";

function sign(value: string) {
  const secret = process.env.AUTH_SECRET || "dev-secret-change";
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function createAdminToken(email: string) {
  const payload = `${email}.${Date.now()}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token: string) {
  const parts = token.split(".");
  if (parts.length < 3) return false;
  const sig = parts[parts.length - 1];
  const payload = parts.slice(0, -1).join(".");
  const expected = sign(payload);
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export async function setAdminCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export async function requireAdmin() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  return token ? verifyAdminToken(token) : false;
}
