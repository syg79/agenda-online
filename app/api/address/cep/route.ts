import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const cep = searchParams.get('cep');

    if (!cep) {
        return NextResponse.json({ error: 'CEP é obrigatório' }, { status: 400 });
    }

    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
        return NextResponse.json({ error: 'CEP inválido' }, { status: 400 });
    }

    try {
        const response = await fetch(`https://www.cepaberto.com/api/v3/cep?cep=${cleanCep}`, {
            headers: {
                'Authorization': `Token token=${process.env.CEPABERTO_TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error('Falha ao buscar CEP no CepAberto');
        }

        const data = await response.json();

        // CepAberto retorno vazio se não encontrar
        if (!data.logradouro) {
            return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 });
        }

        return NextResponse.json({
            address: data.logradouro,
            neighborhood: data.bairro,
            city: data.cidade?.nome,
            state: data.estado?.sigla,
            zipCode: data.cep,
            latitude: data.latitude ? parseFloat(data.latitude) : null,
            longitude: data.longitude ? parseFloat(data.longitude) : null
        });

    } catch (error) {
        console.error('CEP Lookup error:', error);
        return NextResponse.json({ error: 'Erro ao buscar CEP' }, { status: 500 });
    }
}
