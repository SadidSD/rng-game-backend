async function checkApi() {
    console.log('Fetching from NEW API endpoint (/api/products)...');
    try {
        const res = await fetch('http://localhost:3001/api/products');
        console.log('Status:', res.status);
        if (res.ok) {
            const data = await res.json();
            const products = Array.isArray(data) ? data : (data.data || []);
            console.log(`✅ SUCCESS! Found ${products.length} products.`);
            console.log('First item:', products[0]?.name);
        } else {
            console.log('❌ API Error:', res.status, await res.text());
        }
    } catch (e) {
        console.log('❌ Fetch failed:', e.message);
    }
}

setTimeout(checkApi, 5000); // Wait 5s for restart
