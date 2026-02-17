import { checkSlotViability } from '../lib/services/smart-scheduling';

async function test() {
    console.log("Testing Smart Scheduling Logic...");

    // Mock Booking: Downtown Curitiba (Centro) 09:00 - 10:00
    const bookings = [{
        time: '09:00',
        duration: 60,
        latitude: -25.4284,
        longitude: -49.2733 // Centro
    }];

    // Scenario 1: Candidate Slot 10:00 - 11:00 at Batel (Close)
    // Should be VIAVLE
    const batelLat = -25.4400;
    const batelLng = -49.2800;
    console.log("Checking Batel (Close) at 10:00...");
    const result1 = await checkSlotViability(10 * 60, 11 * 60, batelLat, batelLng, bookings);
    console.log("Result 1 (Expect VIABLE):", result1);

    // Scenario 2: Candidate Slot 10:00 - 11:00 at Airport (Far - São José dos Pinhais)
    // Should be IMPOSSIBLE because travel takes > 0 mins (actually ~30 mins)
    // Gap is 10:00 - 10:00 = 0 mins! 
    // Wait, if previous ends at 10:00 and candidate starts at 10:00, gap is 0. 
    // Travels always takes > 0. So physically impossible unless teleport.
    // Let's try candidate 10:30 (Gap 30 mins)

    console.log("Checking Airport (Far) at 10:30...");
    const airportLat = -25.5327;
    const airportLng = -49.1761;
    const result2 = await checkSlotViability(10.5 * 60, 11.5 * 60, airportLat, airportLng, bookings);
    console.log("Result 2 (Expect IMPOSSIBLE/TIGHT):", result2);
}

test();
