import { NextRequest, NextResponse } from 'next/server';
import { tadabase } from '@/lib/tadabase';

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        console.log('[API Teste Cadastro] Recebido:', data);

        const propertyData = data.propertyData || null;

        if (!propertyData) {
            return NextResponse.json(
                { error: 'Dados da propriedade (scraping) não fornecidos.' },
                { status: 400 }
            );
        }

        // Criar um Booking falso (apenas em memória) para enganar o tadabase.syncBooking()
        // O Tadabase.syncBooking exige o objeto Booking do prisma para montar o Payload
        const mockBooking = {
            protocol: `TEST-${Date.now()}`,
            clientName: propertyData.brokerName || 'Teste Scraping',
            clientEmail: 'teste@agendaonline.net.br',
            clientPhone: '(00) 00000-0000',
            brokerDetails: propertyData.brokerName || 'Corretor Teste',
            address: propertyData.address || 'Rua Teste',
            neighborhood: propertyData.neighborhood || 'Bairro Teste',
            city: propertyData.city || 'Curitiba',
            state: propertyData.state || 'PR',
            zipCode: propertyData.zipCode || '80000-000',
            complement: propertyData.complement || propertyData.building || '',
            services: ['photo'], // Serviço padrão para nao dar erro
            date: null,
            time: null,
            duration: null,
            status: 'TEST',
            photographerId: null,
            propertyType: propertyData.propertyType || 'Ap',
            latitude: propertyData.latitude || null,
            longitude: propertyData.longitude || null,
            building: propertyData.building || null,
            area: propertyData.area || 0
        };

        console.log('[API Teste Cadastro] Enviando para o Tadabase...');
        const result = await tadabase.syncBooking(mockBooking, propertyData);

        return NextResponse.json({
            success: true,
            message: 'Dados enviados para o Tadabase com sucesso!',
            tadabaseResult: result,
            mockDataEnviada: mockBooking
        });

    } catch (error: any) {
        console.error('❌ ERRO NO TESTE DE CADASTRO:', error);
        return NextResponse.json(
            { error: `Falha ao processar cadastro: ${error.message}` },
            { status: 500 }
        );
    }
}
