import { tadabase } from '../lib/tadabase';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testTadabase() {
    console.log('🧪 Testing Tadabase Sync V2...');

    // Mock Booking Data with Complex Services
    const mockBooking = {
        protocol: Math.floor(Math.random() * 1000000).toString(),
        address: 'Rua Teste, 123',
        neighborhood: 'Centro Cívico',
        city: 'Curitiba',
        state: 'PR',
        zipCode: '80530-000',
        complement: 'Sala 1',
        propertyType: 'Apartamento',
        area: 100.5,
        clientName: 'A Pena',
        date: new Date(),
        time: '14:30',
        status: 'Pending',
        services: ['Fotos', 'Tour 360', 'Planta Baixa'], // Test complex mapping
        photographer: {
            name: 'Rafael' // Should map to ID
        }
    };

    console.log('📦 Mock Booking:', mockBooking);

    const result = await tadabase.syncBooking(mockBooking);
    console.log('✅ Sync Result:', result);
}

testTadabase();
