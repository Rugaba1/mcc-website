import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// Guard: fail fast with a clear message if DATABASE_URL is missing
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma(): PrismaClient {
  const url = new URL(process.env.DATABASE_URL!);
  const adapter = new PrismaMariaDb({
    host:            url.hostname,
    port:            url.port ? Number(url.port) : 3306,
    user:            url.username,
    password:        url.password,
    database:        url.pathname.slice(1),
    connectionLimit: 5,
  });
  return new PrismaClient({ adapter });
}

// Standard Next.js singleton pattern — one client reused across hot reloads
// (do NOT clear globalForPrisma.prisma before checking — that leaks connections)
export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
