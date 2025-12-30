const BASE_URL = 'http://localhost:3000';

async function testAuth() {
    console.log('🚀 Starting Auth Tests...');

    const storeName = `Test Store ${Date.now()}`;
    const email = `owner_${Date.now()}@example.com`;
    const password = 'password123';

    // 1. Signup
    console.log('\n1. Testing Signup...');
    const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeName, email, password }),
    });

    if (!signupRes.ok) {
        const err = await signupRes.text();
        console.error('❌ Signup Failed:', signupRes.status, err);
        return;
    }
    const signupData = await signupRes.json();
    console.log('✅ Signup Success! Token:', signupData.access_token ? 'Received' : 'Missing');
    const token = signupData.access_token;

    // 2. Login (Verify credentials work)
    console.log('\n2. Testing Login...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!loginRes.ok) {
        console.error('❌ Login Failed:', loginRes.status);
        return;
    }
    console.log('✅ Login Success!');

    // 3. Protected Profile (Verify JWT)
    console.log('\n3. Testing Protected Profile (JWT)...');
    const profileRes = await fetch(`${BASE_URL}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!profileRes.ok) {
        console.error('❌ Profile Access Failed:', profileRes.status);
        return;
    }
    const profile = await profileRes.json();
    console.log('✅ Profile Access Success! Role:', profile.role);

    // 4. Admin Access (Verify RBAC)
    console.log('\n4. Testing Admin Route (RBAC)...');
    const adminRes = await fetch(`${BASE_URL}/auth/admin`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!adminRes.ok) {
        console.error('❌ Admin Access Failed:', adminRes.status);
        return;
    }
    console.log('✅ Admin Access Success!');

    console.log('\n🎉 ALL AUTH TESTS PASSED!');
}

testAuth();
