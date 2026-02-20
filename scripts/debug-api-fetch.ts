
async function debugApiFetchMain() {
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

debugApiFetchMain();
