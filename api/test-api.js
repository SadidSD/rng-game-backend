async function checkApi() {
    console.log('Fetching from API...');
    try {
        const res = await fetch('http://localhost:3001/api/products');
        console.log('Status:', res.status);
        if (res.ok) {
            const data = await res.json();
            // Handle pagination wrapper if exists (e.g. data.data or just data)
            const products = Array.isArray(data) ? data : (data.data || []);
            console.log(`Found ${products.length} products via API.`);
            const cryparion = products.find(p => p.name.includes('Cryparion'));
            if (cryparion) {
                console.log('✅ Cryparion is in the API response!');
                console.log('storeId:', cryparion.storeId);
            } else {
                console.log('❌ Cryparion NOT found in API response.');
                console.log('Sample item:', products[0]);
            }
        } else {
            console.log('❌ API Error:', await res.text());
        }
    } catch (e) {
        console.log('❌ Fetch failed:', e.message);
    }
}

checkApi();
