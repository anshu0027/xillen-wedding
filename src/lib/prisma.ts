import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'], // Add 'query' if you want to debug
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
