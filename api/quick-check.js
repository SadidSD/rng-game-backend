// Quick diagnostic to check what's wrong with production backend
const axios = require('axios');

async function quickCheck() {
    console.log('🔍 Quick Production Check\n');

    const baseUrl = 'https://rng-game-backend.onrender.com';

    // Test 1: Is backend running?
    console.log('1️⃣ Checking if backend is responding...');
    try {
        const response = await axios.get(`${baseUrl}/health`, { timeout: 10000 });
        console.log('✅ Backend is UP');
        console.log('   Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('❌ Backend is DOWN or not responding');
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Error:', error.response.data);
        } else {
            console.log('   Error:', error.message);
        }
        console.log('\n⚠️ LIKELY CAUSE: Missing environment variables in Render');
        console.log('   Go to Render Dashboard → Your Service → Environment');
        console.log('   Add: DATABASE_URL, JWT_SECRET, DIRECT_URL, etc.');
        return;
    }

    // Test 2: Try login
    console.log('\n2️⃣ Testing login endpoint...');
    try {
        const response = await axios.post(`${baseUrl}/api/auth/login`, {
            email: 'admin@tcg.com',
            password: 'tcgadmintestpass'
        }, { timeout: 10000 });
        console.log('✅ Login SUCCESSFUL!');
        console.log('   Token received:', response.data.access_token ? 'YES' : 'NO');
    } catch (error) {
        console.log('❌ Login FAILED');
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Message:', error.response.data?.message || 'Unknown error');
            console.log('   Full error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('   Error:', error.message);
        }
    }
}

quickCheck();
