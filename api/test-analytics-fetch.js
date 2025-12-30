const BASE_URL = 'http://localhost:3000';

async function testAnalyticsFetch() {
    console.log('🚀 Starting Analytics Tests (Fetch Only)...');

    // 1. Get Token (Admin)
    const email = `stats_admin_${Date.now()}@example.com`;
    const password = 'password123';
    const storeName = `Stats Store`;

    console.log('1. Signing up Admin...');
    const authRes = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, storeName })
    });
    if (!authRes.ok) return console.error('Signup failed');
    const token = (await authRes.json()).access_token;

    // 2. Get Dashboard
    console.log('2. Fetching Dashboard Stats...');
    const statsRes = await fetch(`${BASE_URL}/analytics/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (statsRes.ok) {
        const stats = await statsRes.json();
        console.log('✅ Dashboard Stats:', stats);
        // Expect mostly 0s since new store
        if (stats.totalSales === 0 && stats.totalOrders === 0) {
            console.log('✅ Stats initialized correctly.');
        }
    } else {
        console.error('❌ Analytics Failed:', await statsRes.text());
    }
}

testAnalyticsFetch();
