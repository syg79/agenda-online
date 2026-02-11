import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

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
      selectedServices,
      selectedDate,
      selectedTime,
      totalDuration,
      totalPrice
    } = body;

    // 1. Validação básica
    if (!clientEmail || !selectedDate || !selectedTime) {
      return NextResponse.json(
        { error: 'Dados incompletos para o agendamento.' },
        { status: 400 }
      );
    }

    // 2. Gerar Protocolo (Ex: AG-20240205-X7Z)
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    const protocol = `AG-${datePart}-${randomPart}`;

    // 3. Salvar no Banco de Dados (Supabase)
    const booking = await prisma.booking.create({
      data: {
        protocol,
        clientName,
        clientEmail,
        clientPhone,
        notes,
        address,
        neighborhood,
        services: selectedServices, // Array de strings
        date: new Date(selectedDate),
        time: selectedTime,
        duration: totalDuration,
        status: 'CONFIRMED',
        price: totalPrice,
        paymentStatus: 'PENDING'
      }
    });

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
          <p><strong>Serviços:</strong> ${selectedServices.join(', ')}</p>
        </div>

        <p>Se precisar cancelar, entre em contato com antecedência mínima de 24h.</p>
        <p>Atenciosamente,<br/>Equipe Agenda Online</p>
      </div>
    `;

    // Não esperamos o email terminar para responder ao usuário (mais rápido)
    sendEmail({
      to: clientEmail,
      subject: `Confirmação de Agendamento: ${protocol}`,
      html: emailHtml
    });

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
