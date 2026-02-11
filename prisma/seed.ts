import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Como estamos no MVP com schema simplificado (apenas tabela Booking),
  // não podemos criar fotógrafos ou configurações complexas pois as tabelas não existem.
  
  // Limpa agendamentos antigos (opcional, cuidado em produção)
  // await prisma.booking.deleteMany()

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