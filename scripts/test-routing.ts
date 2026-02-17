
const { getRouteStats } = require('../lib/services/routing');
const { prisma } = require('../lib/prisma');

async function main() {
    console.log("Testing Routing Service...");

    // Example: Downtown Curitiba -> Batel (Close)
    const origin = { lat: -25.4284, lng: -49.2733 }; // Centro
    const dest1 = { lat: -25.4400, lng: -49.2800 }; // Batel

    // Example: Downtown -> Airport (Far)
    const dest2 = { lat: -25.5327, lng: -49.1755 }; // Afonso Pena

    console.log(`\n1. Checking Route: Centro -> Batel`);
    const route1 = await getRouteStats(origin.lat, origin.lng, dest1.lat, dest1.lng);
    console.log(`   Result: ${route1.distance} km, ${route1.duration} mins (Source: ${route1.source})`);

    console.log(`\n2. Checking Route: Centro -> Airport`);
    const route2 = await getRouteStats(origin.lat, origin.lng, dest2.lat, dest2.lng);
    console.log(`   Result: ${route2.distance} km, ${route2.duration} mins (Source: ${route2.source})`);

    console.log("\nDone.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        // Mocking prisma disconnect if needed, but script will exit
    });
