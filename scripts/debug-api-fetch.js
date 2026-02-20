
const fetch = require('node-fetch'); // Check if node-fetch is available, or use built-in fetch if Node 18+

async function main() {
    console.log('Fetching...');
    try {
        const res = await fetch('http://localhost:3000/api/secretary/dashboard?type=pending');
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body:', text);
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

main();
