
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import axios from 'axios';

async function main() {
  console.log('Iniciando verificação das configurações de ambiente...');

  // Testar conexão com o Supabase (Prisma)
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Conexão com o Supabase (Prisma) bem-sucedida!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro ao conectar com o Supabase (Prisma):', error);
  }

  // Testar conexão com o Gmail (Nodemailer)
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    await transporter.verify();
    console.log('✅ Conexão com o Gmail (Nodemailer) bem-sucedida!');
  } catch (error) {
    console.error('❌ Erro ao conectar com o Gmail (Nodemailer):', error);
  }

  // Testar API do Google Maps
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=Google&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    if (response.data.status === 'OK') {
      console.log('✅ API do Google Maps funcionando corretamente!');
    } else {
      console.error('❌ Erro na API do Google Maps:', response.data.status, response.data.error_message);
    }
  } catch (error) {
    console.error('❌ Erro ao chamar a API do Google Maps:', error);
  }

  // Testar API do Tadabase
  try {
    const response = await axios.get(
      `${process.env.TADABASE_API_URL}/auth/whoami`,
      {
        headers: {
          'X-Tadabase-App-Id': process.env.TADABASE_APP_ID,
          'X-Tadabase-App-Key': process.env.TADABASE_APP_KEY,
          'X-Tadabase-App-Secret': process.env.TADABASE_APP_SECRET,
        },
      }
    );
    if (response.status === 200 && response.data.user) {
      console.log('✅ API do Tadabase funcionando corretamente! Conectado como:', response.data.user.name);
    } else {
      console.error('❌ Erro na API do Tadabase:', response.data);
    }
  } catch (error) {
    console.error('❌ Erro ao chamar a API do Tadabase:', error);
  }

  console.log('\nVerificação concluída.');
}

main();
