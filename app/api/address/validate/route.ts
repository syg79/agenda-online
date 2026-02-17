import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { address } = body;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!address) return NextResponse.json({ error: 'Endereço obrigatório' }, { status: 400 });
  if (!apiKey) {
    console.error('❌ Erro: API Key do Google Maps não encontrada.');
    return NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 });
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  try {
    const res = await fetch(url, {
      headers: {
        'Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      }
    });
    const data = await res.json();

    if (data.status !== 'OK' || data.results.length === 0) {
      console.error('❌ Erro Google Geocoding API:', data.status, data.error_message);
      return NextResponse.json({ inCoverage: false, error: 'Endereço não encontrado' });
    }

    const result = data.results[0];
    const addressComponents = result.address_components;

    let city = '';
    let neighborhood = '';
    let zipCode = '';
    let state = '';

    for (const component of addressComponents) {
      if (component.types.includes('administrative_area_level_2')) {
        city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        state = component.short_name;
      }
      if (component.types.includes('sublocality') || component.types.includes('sublocality_level_1')) {
        neighborhood = component.long_name;
      }
      if (component.types.includes('postal_code')) {
        zipCode = component.long_name;
      }
    }

    // Lógica de Cobertura: Aceitar APENAS Curitiba
    const allowedCity = 'Curitiba';

    if (city === allowedCity) {

      // LAZY LEARNING: Save precise Lat/Lng for this CEP
      if (zipCode && result.geometry.location) {
        const cleanZip = zipCode.replace(/\D/g, '');
        if (cleanZip.length === 8) {
          try {
            await prisma.cepLocation.upsert({
              where: { zipCode: cleanZip },
              update: {
                latitude: result.geometry.location.lat,
                longitude: result.geometry.location.lng,
                neighborhood: neighborhood,
                city: city
              },
              create: {
                zipCode: cleanZip,
                latitude: result.geometry.location.lat,
                longitude: result.geometry.location.lng,
                neighborhood: neighborhood,
                city: city
              }
            });
          } catch (e) {
            // Non-blocking error
            console.error("Failed to save CepLocation:", e);
          }
        }
      }

      return NextResponse.json({
        inCoverage: true,
        city,
        neighborhood,
        state,
        zipCode,
        formattedAddress: result.formatted_address,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
      });
    } else {
      return NextResponse.json({
        inCoverage: false,
        city,
        neighborhood,
        state,
        zipCode,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
      });
    }

  } catch (error) {
    console.error('❌ Erro interno na API de validação:', error);
    return NextResponse.json({ error: 'Erro ao validar endereço' }, { status: 500 });
  }
}
