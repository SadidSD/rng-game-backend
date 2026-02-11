// Test production backend health and database connectivity
const axios = require('axios');

const BACKEND_URL = 'https://rng-game-backend.onrender.com';

async function testBackend() {
    console.log('🔍 Testing Production Backend...\n');

    // Test 1: Health endpoint
    try {
        console.log('1️⃣ Testing health endpoint...');
        const health = await axios.get(`${BACKEND_URL}/health`);
        console.log('✅ Health check passed');
        console.log('   Status:', health.data.status);
        console.log('   Database:', health.data.checks?.database?.status || 'unknown');
        console.log('   Uptime:', health.data.uptime);
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
    }

    // Test 2: API base
    try {
        console.log('\n2️⃣ Testing API base...');
        const api = await axios.get(`${BACKEND_URL}/api`);
        console.log('✅ API responding');
    } catch (error) {
        console.log('❌ API not responding:', error.response?.status || error.message);
    }

    // Test 3: Login attempt (will fail but shows error details)
    try {
        console.log('\n3️⃣ Testing login endpoint...');
        const login = await axios.post(`${BACKEND_URL}/api/auth/login`, {
            email: 'admin@tcg.com',
            password: 'tcgadmintestpass'
        });
        console.log('✅ Login successful!');
        console.log('   Token received:', login.data.access_token ? 'YES' : 'NO');
    } catch (error) {
        console.log('❌ Login failed');
        console.log('   Status:', error.response?.status);
        console.log('   Error:', error.response?.data?.message || error.message);
        console.log('   Details:', JSON.stringify(error.response?.data, null, 2));
    }

    // Test 4: Check public endpoints
    try {
        console.log('\n4️⃣ Testing public products endpoint...');
        const products = await axios.get(`${BACKEND_URL}/api/public/products`);
        console.log('✅ Public API working');
        console.log('   Products found:', products.data.length || 0);
    } catch (error) {
        console.log('❌ Public API failed:', error.response?.status || error.message);
    }
}

testBackend().catch(console.error);
