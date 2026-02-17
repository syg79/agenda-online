// @ts-nocheck
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Criar um fotógrafo padrão se não existir
  // Criar fotógrafos padrão para testes
  // 1. Fotógrafos com Habilidades (Services)
  const photographers = [
    { name: 'Augusto', email: 'augusto@exemplo.com', services: ['photo', 'video_landscape', 'video_portrait'] },
    { name: 'Renato', email: 'renato@exemplo.com', services: ['photo'] },
    { name: 'Rafael', email: 'rafael@exemplo.com', services: ['photo', 'video_landscape', 'video_portrait', 'drone_photo', 'drone_photo_video'] },
    { name: 'Rodrigo', email: 'rodrigo@exemplo.com', services: ['photo'] }
  ];

  const dbPhotographers = [];

  for (const p of photographers) {
    const created = await prisma.photographer.upsert({
      where: { email: p.email },
      update: { services: p.services },
      create: {
        name: p.name,
        email: p.email,
        active: true,
        services: p.services
      },
    });
    dbPhotographers.push(created);
    console.log(`📸 Fotógrafo garantido: ${created.name} (Serviços: ${created.services.length})`);
  }

  // 2. Regiões (Exemplos)
  const regions = [
    { name: 'Curitiba - Central', cities: ['Curitiba'], neighborhoods: ['Centro', 'Batel', 'Água Verde', 'Bigorrilho'] },
    { name: 'Curitiba - Sul', cities: ['Curitiba'], neighborhoods: ['Sítio Cercado', 'Tatuquara', 'Pinheirinho', 'Umbara'] },
    { name: 'Região Metropolitana', cities: ['São José dos Pinhais', 'Colombo', 'Pinhais'], neighborhoods: [] }
  ];

  for (const r of regions) {
    const existing = await prisma.region.findFirst({ where: { name: r.name } });
    if (!existing) {
      await prisma.region.create({ data: r });
    }
  }

  // Create Regions references for linking
  const regCentral = await prisma.region.findFirst({ where: { name: 'Curitiba - Central' } });
  const regSul = await prisma.region.findFirst({ where: { name: 'Curitiba - Sul' } });
  const regMetro = await prisma.region.findFirst({ where: { name: 'Região Metropolitana' } });

  if (!regCentral || !regSul || !regMetro) {
    throw new Error('Falha ao garantir regiões.');
  }

  console.log('🗺️ Regiões garantidas.');

  // 3. Vincular Fotógrafos a Regiões
  // Todos atendem Central
  for (const p of dbPhotographers) {
    const exists = await prisma.photographerRegion.findFirst({
      where: { photographerId: p.id, regionId: regCentral.id }
    });
    if (!exists) {
      await prisma.photographerRegion.create({ data: { photographerId: p.id, regionId: regCentral.id } });
    }
  }

  // Apenas alguns atendem Sul (Ex: Rodrigo e Rafael)
  const pRodrigo = dbPhotographers.find(p => p.name === 'Rodrigo');
  const pRafael = dbPhotographers.find(p => p.name === 'Rafael');

  if (pRodrigo) {
    const exists = await prisma.photographerRegion.findFirst({ where: { photographerId: pRodrigo.id, regionId: regSul.id } });
    if (!exists) await prisma.photographerRegion.create({ data: { photographerId: pRodrigo.id, regionId: regSul.id } });
  }
  if (pRafael) {
    const exists = await prisma.photographerRegion.findFirst({ where: { photographerId: pRafael.id, regionId: regSul.id } });
    if (!exists) await prisma.photographerRegion.create({ data: { photographerId: pRafael.id, regionId: regSul.id } });
  }

  console.log('📍 Vínculos de região criados.');

  // 4. Preferências de Cliente Exemplo
  // Cliente J8
  const clientJ8 = await prisma.client.upsert({
    where: { email: 'j8@cliente.com' },
    update: {},
    create: { name: 'Imobiliária J8', email: 'j8@cliente.com' }
  });

  // Preferencia: 1-Renato, 2-Augusto
  const pRenato = dbPhotographers.find(p => p.name === 'Renato');
  const pAugusto = dbPhotographers.find(p => p.name === 'Augusto');

  if (pRenato) {
    const exists = await prisma.clientPreference.findFirst({ where: { clientId: clientJ8.id, photographerId: pRenato.id } });
    if (!exists) {
      await prisma.clientPreference.create({
        data: { clientId: clientJ8.id, photographerId: pRenato.id, priority: 1 }
      });
    }
  }
  if (pAugusto) {
    const exists = await prisma.clientPreference.findFirst({ where: { clientId: clientJ8.id, photographerId: pAugusto.id } });
    if (!exists) {
      await prisma.clientPreference.create({
        data: { clientId: clientJ8.id, photographerId: pAugusto.id, priority: 2 }
      });
    }
  }

  console.log('⭐ Preferências do cliente J8 criadas.');

  console.log('⭐ Preferências do cliente J8 criadas.');

  // 5. Agendamentos de Teste (Mock Bookings)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookings = [
    // PENDENTES
    {
      clientName: 'Maria Silva',
      selectedServices: ['photo'],
      address: 'Rua XV de Novembro, 100',
      neighborhood: 'Centro',
      latitude: -25.429, longitude: -49.271, // Centro
      date: new Date(today.getTime() + 86400000 * 2), // Daqui 2 dias
      time: '09:00',
      status: 'PENDING',
      photographerId: null
    },
    {
      clientName: 'João Souza',
      selectedServices: ['video_portrait'],
      address: 'Av. Batel, 1230',
      neighborhood: 'Batel',
      latitude: -25.442, longitude: -49.293, // Batel
      date: new Date(today.getTime() + 86400000 * 3), // Daqui 3 dias
      time: '14:00',
      status: 'PENDING',
      photographerId: null
    },
    {
      clientName: 'Ana Oliveira',
      selectedServices: ['photo', 'drone_photo'],
      address: 'Rua da Cidadania do Boqueirão',
      neighborhood: 'Boqueirão',
      latitude: -25.500, longitude: -49.242, // Boqueirão
      date: new Date(today.getTime() + 86400000 * 1), // Amanhã
      time: '10:00',
      status: 'PENDING',
      photographerId: null
    },
    // CONFIRMADOS (Para preencher a timeline)
    {
      clientName: 'Pedro Santos',
      selectedServices: ['photo'],
      address: 'Rua Mateus Leme, 500',
      neighborhood: 'Centro Cívico',
      latitude: -25.416, longitude: -49.270,
      date: today, // HOJE
      time: '09:00',
      duration: 60,
      status: 'CONFIRMED',
      photographerId: dbPhotographers.find(p => p.name === 'Rafael')?.id
    },
    {
      clientName: 'Lucia Costa',
      selectedServices: ['video_landscape'],
      address: 'Rua Padre Anchieta, 2000',
      neighborhood: 'Bigorrilho',
      latitude: -25.435, longitude: -49.300,
      date: today, // HOJE
      time: '14:00',
      duration: 90,
      status: 'CONFIRMED',
      photographerId: dbPhotographers.find(p => p.name === 'Rafael')?.id
    },
    {
      clientName: 'Carlos Lima',
      selectedServices: ['photo'],
      address: 'Rua Itupava, 1200',
      neighborhood: 'Alto da XV',
      latitude: -25.425, longitude: -49.255,
      date: today, // HOJE
      time: '10:00',
      duration: 60,
      status: 'CONFIRMED',
      photographerId: dbPhotographers.find(p => p.name === 'Augusto')?.id
    }
  ];

  for (const b of bookings) {
    await prisma.booking.create({
      data: {
        clientName: b.clientName,
        clientEmail: 'teste@exemplo.com',
        clientPhone: '4199999999',
        services: b.selectedServices,
        address: b.address,
        neighborhood: b.neighborhood,
        latitude: b.latitude,
        longitude: b.longitude,
        date: b.date,
        time: b.time,
        duration: b.duration || 60,
        status: b.status,
        photographerId: b.photographerId,
        price: 150.00,
        paymentStatus: 'PENDING',
        protocol: `TEST-${Math.floor(Math.random() * 10000)}`
      }
    });
  }
  console.log(`📅 ${bookings.length} Agendamentos de teste criados.`);

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