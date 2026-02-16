import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { tadabase } from '@/lib/tadabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      clientName,
      clientEmail,
      clientPhone,
      notes,
      address,
      neighborhood,
      zipCode,
      complement,
      latitude,
      longitude,
      selectedServices,
      selectedDate,
      selectedTime,
      totalDuration,
      totalPrice,
      sourceProtocol // New optional field
    } = body;

    // 1. Validação básica
    if (!clientEmail || !selectedDate || !selectedTime) {
      return NextResponse.json(
        { error: 'Dados incompletos para o agendamento.' },
        { status: 400 }
      );
    }

    // 2. Check for existing booking (Update Logic)
    let protocol = '';
    let booking;
    let isUpdate = false;

    if (sourceProtocol) {
      const existing = await prisma.booking.findUnique({
        where: { protocol: sourceProtocol }
      });

      if (existing) {
        console.log(`📝 Updating existing booking: ${sourceProtocol}`);
        protocol = sourceProtocol;
        isUpdate = true;

        booking = await prisma.booking.update({
          where: { id: existing.id },
          data: {
            clientName,
            clientEmail,
            clientPhone,
            notes,
            address,
            neighborhood,
            zipCode,
            complement,
            latitude,
            longitude,
            services: selectedServices,
            date: new Date(selectedDate),
            time: selectedTime,
            duration: totalDuration,
            status: 'CONFIRMED',
            price: totalPrice,
            // Protocol remains the same
          }
        });
      }
    }

    // 3. Create New if not updating
    if (!booking) {
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
      protocol = `AG-${datePart}-${randomPart}`;

      console.log(`✨ Creating new booking: ${protocol}`);

      booking = await prisma.booking.create({
        data: {
          protocol,
          clientName,
          clientEmail,
          clientPhone,
          notes,
          address,
          neighborhood,
          zipCode,
          complement,
          latitude,
          longitude,
          services: selectedServices, // Array de strings
          date: new Date(selectedDate),
          time: selectedTime,
          duration: totalDuration,
          status: 'CONFIRMED',
          price: totalPrice,
          paymentStatus: 'PENDING'
        }
      });
    }

    // 4. Enviar Email de Confirmação
    const emailHtml = `
      <div style="font-family: sans-serif; color: #333;">
        <h1>Agendamento Confirmado! ✅</h1>
        <p>Olá <strong>${clientName}</strong>,</p>
        <p>Recebemos seu agendamento com sucesso. Abaixo estão os detalhes:</p>
        
        <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Protocolo:</strong> ${protocol}</p>
          <p><strong>Data:</strong> ${new Date(selectedDate).toLocaleDateString('pt-BR')}</p>
          <p><strong>Horário:</strong> ${selectedTime}</p>
          <p><strong>Endereço:</strong> ${address} - ${neighborhood}</p>
          <p><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + ' - ' + neighborhood + ', Curitiba - PR')}" style="color: #2563eb; text-decoration: none;">📍 Ver localização no mapa</a></p>
          <p><strong>Serviços:</strong> ${selectedServices.join(', ')}</p>
        </div>

        <p>Se precisar cancelar, entre em contato com antecedência mínima de 24h.</p>
        <p>Atenciosamente,<br/>Equipe Agenda Online</p>
      </div>
    `;

    // No Vercel (Serverless), precisamos aguardar (await) ou a função é congelada antes de terminar.
    await sendEmail({
      to: clientEmail,
      subject: `Confirmação de Agendamento: ${protocol}`,
      html: emailHtml
    });

    // 5. Integração com Tadabase (Service)
    // Passamos o booking recém criado. O service lida com campos opcionais.
    // Como acabou de criar, photographer é null/undefined, o que é correto.
    await tadabase.syncBooking(booking);

    // 5. Retornar sucesso
    return NextResponse.json({
      success: true,
      protocol,
      bookingId: booking.id
    });

  } catch (error: any) {
    console.error('Erro ao criar agendamento:', error);

    // Tratamento de erro específico do Prisma (ex: tabela não existe)
    if (error.code === 'P2021') {
      return NextResponse.json(
        { error: 'Erro interno: Tabela do banco de dados não encontrada. Rode as migrations.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Falha ao processar agendamento. Tente novamente.' },
      { status: 500 }
    );
  }
}
