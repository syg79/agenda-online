// lib/prisma.ts
// Cliente Prisma Singleton para ambiente Serverless (Vercel)

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// ================================
// Monitoramento de Queries Lentas
// ================================
if (process.env.NODE_ENV === 'development') {
  prisma.$use(async (params, next) => {
    const before = Date.now()
    const result = await next(params)
    const after = Date.now()
    
    if (after - before > 2000) {
      console.warn(
        `⚠️ Query lenta: ${params.model}.${params.action} levou ${after - before}ms`
      )
    }
    
    return result
  })
}

export default prisma