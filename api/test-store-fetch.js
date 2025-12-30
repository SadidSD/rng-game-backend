const BASE_URL = 'http://localhost:3000';

async function testStoreFetch() {
    console.log('🚀 Starting Store Settings Tests (Fetch Only)...');

    // 1. Get Token (Admin/Owner)
    const email = `owner_${Date.now()}@example.com`;
    const password = 'password123';
    const storeName = `My Awesome Store`;

    console.log('1. Signing up Owner...');
    const authRes = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, storeName })
    });
    if (!authRes.ok) return console.error('Signup failed');
    const token = (await authRes.json()).access_token;

    // 2. Get Settings
    console.log('2. Fetching Store Settings...');
    const getRes = await fetch(`${BASE_URL}/store`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const store = await getRes.json();
    console.log('✅ Current Name:', store.name);

    // 3. Update Settings
    console.log('3. Updating Name...');
    const updateRes = await fetch(`${BASE_URL}/store`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Renamed Store' })
    });

    if (updateRes.ok) {
        const updated = await updateRes.json();
        console.log('✅ New Name:', updated.name);
        if (updated.name === 'Renamed Store') console.log('✅ Update Verified.');
    } else {
        console.error('❌ Update Failed:', await updateRes.text());
    }
}

testStoreFetch();
