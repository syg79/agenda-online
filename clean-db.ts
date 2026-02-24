import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const deleted = await prisma.booking.deleteMany({})
    console.log(`Deleted ${deleted.count} bookings from the database.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
