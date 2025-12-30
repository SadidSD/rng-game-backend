const BASE_URL = 'http://localhost:3000';

async function testIntegrationsFetch() {
    console.log('🚀 Starting Integration Tests (Fetch Only)...');

    // 1. Get Token (Admin)
    const email = `int_admin_${Date.now()}@example.com`;
    const password = 'password123';
    const storeName = `Integration Store`;

    console.log('1. Signing up Admin...');
    const authRes = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, storeName })
    });
    if (!authRes.ok) return console.error('Signup failed');
    const token = (await authRes.json()).access_token;

    // 2. Trigger Sync
    console.log('2. Triggering eBay Sync...');
    const ebayRes = await fetch(`${BASE_URL}/integrations/ebay/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (ebayRes.ok) {
        const data = await ebayRes.json();
        console.log('✅ eBay Sync Response:', data.message);
    } else {
        console.error('❌ eBay Sync Failed:', await ebayRes.text());
    }
}

testIntegrationsFetch();
