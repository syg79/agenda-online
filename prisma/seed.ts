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