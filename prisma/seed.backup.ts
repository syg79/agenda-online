// prisma/seed.backup.ts
// ⚠️ ESTE ARQUIVO É UM BACKUP DA LÓGICA COMPLEXA (FASE 2)
// Ele não está sendo usado no MVP atual porque as tabelas (Photographer, CoverageArea)
// foram removidas temporariamente para simplificar o deploy.

import { PrismaClient } from '@prisma/client'
import { CURITIBA_NEIGHBORHOODS, RMC_MUNICIPALITIES } from '../lib/constants'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados (BACKUP)...')

  // ================================
  // LIMPAR DADOS EXISTENTES
  // ================================
  console.log('🧹 Limpando dados existentes...')
  // Comentado para não dar erro de compilação no MVP
  /*
  await prisma.webhookLog.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.photographerCoverageArea.deleteMany()
  await prisma.coverageArea.deleteMany()
  await prisma.timeBlock.deleteMany()
  await prisma.photographer.deleteMany()
  await prisma.systemConfig.deleteMany()
  */

  // ================================
  // CRIAR FOTÓGRAFOS
  // ================================
  console.log('📸 Criando fotógrafos...')
  
  /*
  const augusto = await prisma.photographer.create({
    data: {
      name: 'Augusto',
      email: 'augusto@empresa.com.br',
      phone: '41999990001',
      services: ['photo', 'video_landscape', 'video_portrait'],
      active: true,
    },
  })

  const renato = await prisma.photographer.create({
    data: {
      name: 'Renato',
      email: 'renato@empresa.com.br',
      phone: '41999990002',
      services: ['photo'],
      active: true,
    },
  })

  const rafael = await prisma.photographer.create({
    data: {
      name: 'Rafael',
      email: 'rafael@empresa.com.br',
      phone: '41999990003',
      services: ['photo', 'video_landscape', 'video_portrait', 'drone_photo', 'drone_photo_video'],
      active: true,
    },
  })

  const rodrigo = await prisma.photographer.create({
    data: {
      name: 'Rodrigo',
      email: 'rodrigo@empresa.com.br',
      phone: '41999990004',
      services: ['photo'],
      active: true,
    },
  })
  */

  // ================================
  // CRIAR ÁREAS DE COBERTURA (BAIRROS)
  // ================================
  console.log('🏘️ Criando bairros de Curitiba...')
  
  /*
  const neighborhoodAreas = await Promise.all(
    CURITIBA_NEIGHBORHOODS.map(neighborhood =>
      prisma.coverageArea.create({
        data: {
          type: 'neighborhood',
          value: neighborhood,
          city: 'Curitiba',
          active: true,
        },
      })
    )
  )
  */

  // ================================
  // CRIAR EXCLUSÕES (MUNICÍPIOS RMC)
  // ================================
  console.log('🚫 Criando exclusões (RMC)...')
  
  /*
  const exclusionAreas = await Promise.all(
    RMC_MUNICIPALITIES.map(municipality =>
      prisma.coverageArea.create({
        data: {
          type: 'exclusion',
          value: municipality,
          city: municipality,
          active: true,
        },
      })
    )
  )
  */

  // ================================
  // CONFIGURAÇÕES DO SISTEMA
  // ================================
  console.log('⚙️ Criando configurações do sistema...')
  
  /*
  await prisma.systemConfig.createMany({
    data: [
      {
        key: 'operating_hours',
        value: {
          weekdays: { start: '08:00', end: '17:30' },
          saturday: { start: '08:00', end: '13:00' },
          sunday: null,
        },
      },
      {
        key: 'slot_config',
        value: {
          intervalMinutes: 30,
          minAdvanceHours: 24,
          maxAdvanceDays: 30,
        },
      },
      {
        key: 'cancellation_rules',
        value: {
          freeUntilHours: 24,
          halfFeeUntilHours: 12,
          fullFeeUnderHours: 12,
          noOnlineCancelHours: 2,
        },
      },
      {
        key: 'coverage_margin_km',
        value: { km: 3 },
      },
    ],
  })
  */

  console.log('✅ Backup finalizado (código comentado para preservação)')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })