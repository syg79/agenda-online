// prisma/seed.ts
// Script para popular o banco de dados com dados iniciais

import { PrismaClient } from '@prisma/client'
import { CURITIBA_NEIGHBORHOODS, RMC_MUNICIPALITIES } from '../lib/constants'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // ================================
  // LIMPAR DADOS EXISTENTES (opcional)
  // ================================
  console.log('🧹 Limpando dados existentes...')
  await prisma.webhookLog.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.photographerCoverageArea.deleteMany()
  await prisma.coverageArea.deleteMany()
  await prisma.timeBlock.deleteMany()
  await prisma.photographer.deleteMany()
  await prisma.systemConfig.deleteMany()

  // ================================
  // CRIAR FOTÓGRAFOS
  // ================================
  console.log('📸 Criando fotógrafos...')
  
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

  console.log(`   ✅ ${[augusto, renato, rafael, rodrigo].length} fotógrafos criados`)

  // ================================
  // CRIAR ÁREAS DE COBERTURA (BAIRROS)
  // ================================
  console.log('🏘️ Criando bairros de Curitiba...')
  
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

  console.log(`   ✅ ${neighborhoodAreas.length} bairros criados`)

  // ================================
  // CRIAR EXCLUSÕES (MUNICÍPIOS RMC)
  // ================================
  console.log('🚫 Criando exclusões (RMC)...')
  
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

  console.log(`   ✅ ${exclusionAreas.length} municípios excluídos criados`)

  // ================================
  // VINCULAR ÁREAS AOS FOTÓGRAFOS
  // ================================
  console.log('🔗 Vinculando áreas aos fotógrafos...')
  
  const photographers = [augusto, renato, rafael, rodrigo]
  
  for (const photographer of photographers) {
    await Promise.all(
      neighborhoodAreas.map(area =>
        prisma.photographerCoverageArea.create({
          data: {
            photographerId: photographer.id,
            coverageAreaId: area.id,
          },
        })
      )
    )
  }

  console.log(`   ✅ Áreas vinculadas a ${photographers.length} fotógrafos`)

  // ================================
  // CONFIGURAÇÕES DO SISTEMA
  // ================================
  console.log('⚙️ Criando configurações do sistema...')
  
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

  console.log('   ✅ Configurações do sistema criadas')

  // ================================
  // RESUMO
  // ================================
  console.log('\n✨ Seed concluído com sucesso!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📸 Fotógrafos: 4`)
  console.log(`🏘️ Bairros: ${CURITIBA_NEIGHBORHOODS.length}`)
  console.log(`🚫 Exclusões: ${RMC_MUNICIPALITIES.length}`)
  console.log(`⚙️ Configurações: 4`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })