import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) return NextResponse.json({ suggestions: [] });

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Erro: API Key do Google Maps não encontrada no servidor.');
    return NextResponse.json({ suggestions: [] });
  }

  // Restringe a busca ao Brasil e centraliza em Curitiba
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&components=country:br&location=-25.4284,-49.2733&radius=20000&key=${apiKey}`;

  try {
    // Adiciona Referer para passar por restrições de domínio da chave
    const res = await fetch(url, {
      headers: {
        'Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      }
    });
    const data = await res.json();
    
    if (data.status === 'OK') {
      const suggestions = data.predictions.map((p: any) => p.description);
      return NextResponse.json({ suggestions });
    }
    
    console.error('❌ Erro Google Places API:', data.status, data.error_message);
    return NextResponse.json({ suggestions: [] });
  } catch (error) {
    console.error('❌ Erro interno na API de busca:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
