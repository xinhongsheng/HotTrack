import { PrismaClient } from './src/generated/prisma/client.ts'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./data/hottrack.db',
})

export const prisma = new PrismaClient({ adapter })

export async function initDB() {
  await prisma.$connect()
  return prisma
}

export function getDB() {
  return prisma
}

export async function closeDB() {
  await prisma.$disconnect()
}
