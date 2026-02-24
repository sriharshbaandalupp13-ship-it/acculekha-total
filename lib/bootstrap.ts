import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { defaultProducts } from "@/lib/default-products";

let started = false;

export async function ensureBootstrap() {
  if (started) return;
  started = true;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const existing = await db.user.findUnique({ where: { email: adminEmail } });
    if (!existing) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await db.user.create({
        data: { email: adminEmail, passwordHash, role: "admin" }
      });
    }
  }

  const count = await db.product.count();
  if (count === 0) {
    await db.product.createMany({
      data: defaultProducts
    });
  }
}
