import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Criar um fotógrafo padrão se não existir
  const photographer = await prisma.photographer.upsert({
    where: { email: 'fotografo@exemplo.com' },
    update: {},
    create: {
      name: 'Fotógrafo Principal',
      email: 'fotografo@exemplo.com',
      active: true,
    },
  })

  console.log(`📸 Fotógrafo garantido: ${photographer.name}`)

  console.log('✅ Seed finalizado com sucesso!')
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