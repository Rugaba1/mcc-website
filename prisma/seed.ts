import * as dotenv from "dotenv";
import {
  ALL_PERMISSION_CODES,
  REGULAR_PERMISSION_CODES,
  PERMISSION_DESCRIPTIONS,
  REGULAR_PERMISSION_LABELS,
  ADMIN_CODE,
} from "@/lib/permissions/catalog";
dotenv.config();

import { PrismaClient } from "@/lib/generated/prisma";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

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
  // ── Permissions ───────────────────────────────────────────────────────────
  const permissionCodes = [...ALL_PERMISSION_CODES, ...REGULAR_PERMISSION_CODES];
  for (const code of permissionCodes) {
    const description =
      PERMISSION_DESCRIPTIONS[code] ?? REGULAR_PERMISSION_LABELS[code];
    await prisma.permission.upsert({
      where: { code },
      update: { description },
      create: { code, description },
    });
  }

  console.log(`✅ ${permissionCodes.length} permissions seeded`);

  await prisma.currency.upsert({
    where: { code: "RWF" },
    update: {},
    create: {
      code: "RWF",
      name: "Rwandan franc",
      symbol: "FRw",
      decimalDigits: 0,
      enabled: true,
      isBase: true,
      rateToBase: 1,
    },
  });
  console.log("✅ Base currency seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
