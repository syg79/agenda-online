import { tadabase } from '../lib/tadabase';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env' });

async function testSync() {
    console.log('🧪 Testing Tadabase Sync V2...');

    const mockBooking = {
        protocol: Math.floor(Math.random() * 1000000).toString(), // Random protocol
        address: 'Rua Teste, 123',
        neighborhood: 'Centro Cívico', // Should map to City
        city: 'Curitiba', // Should map to State
        state: 'PR',
        zipCode: '80530-000',
        complement: 'Sala 1',
        propertyType: 'Apartamento',
        area: '100.5',
        clientName: 'A Pena',
        date: new Date(),
        time: '14:30', // Text field?
        status: 'Pending',
        photographer: { name: 'Rafael' }
    };

    console.log('📦 Mock Booking:', mockBooking);

    try {
        const result = await tadabase.syncBooking(mockBooking);
        console.log('✅ Sync Result:', result);
    } catch (error) {
        console.error('❌ Sync Failed:', error);
    }
}

testSync();
