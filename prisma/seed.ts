import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "../src/lib/generated/prisma";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { ROLE_IDS } from "../src/lib/constants";
import bcrypt from "bcryptjs";
// Parse mysql://user:pass@host:port/database
const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: url.port ? Number(url.port) : 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });
async function main() {
  console.log("🌱 Seeding roles…");

  for (const [roleName, id] of Object.entries(ROLE_IDS)) {
    await prisma.role.upsert({
      where: { id },
      update: { roleName },
      create: { id, roleName },
    });
  }
  console.log(`✅ ${Object.keys(ROLE_IDS).length} roles seeded`);

  // ── Admin user ──────────────────────────────────────────
  const email = (process.env.ADMIN_EMAIL ?? "admin@mcc.rw").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin@mcc.rw";
  if (!password) throw new Error("Set ADMIN_PASSWORD in .env before seeding");

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      // re-running the seed re-asserts the role but never resets the password
      role: { set: [{ id: ROLE_IDS.ADMIN }] },
      isActive: true,
    },
    create: {
      email,
      firstName: "Admin",
      lastName: "MCC",
      password: await bcrypt.hash(password, 12), // same cost as the register route
      isActive: true,
      emailVerifiedAt: new Date(),
      role: { connect: [{ id: ROLE_IDS.ADMIN }] },
    },
    select: { id: true, email: true },
  });

  console.log(`✅ Admin user ready: ${admin.email}`);
}
  
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());