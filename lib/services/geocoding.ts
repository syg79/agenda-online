const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface Coordinates {
    lat: number;
    lng: number;
}

export async function geocodeAddress(address: string): Promise<Coordinates | null> {
    if (!GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API Key is missing');
        return null;
    }

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            return {
                lat: location.lat,
                lng: location.lng,
            };
        } else {
            console.warn(`Geocoding failed for address: ${address}`, data.status);
            return null;
        }
    } catch (error) {
        console.error('Error fetching geocode:', error);
        return null;
    }
}
