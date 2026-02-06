import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) return NextResponse.json({ suggestions: [] });

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  // Restringe a busca ao Brasil e centraliza em Curitiba
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&components=country:br&location=-25.4284,-49.2733&radius=20000&key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.status === 'OK') {
      const suggestions = data.predictions.map((p: any) => p.description);
      return NextResponse.json({ suggestions });
    }
    return NextResponse.json({ suggestions: [] });
  } catch (error) {
    return NextResponse.json({ suggestions: [] });
  }
}
