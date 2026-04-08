import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

let prisma;

if (!globalForPrisma.prismaWithFix3) {
  // Evita que '?sslmode=require' de la URL sobreescriba nuestra regla rejectUnauthorized: false
  const connectionString = process.env.DATABASE_URL.replace('?sslmode=require', '');
  const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  prisma = globalForPrisma.prismaWithFix3;
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaWithFix3 = prisma;
}

export default prisma;
