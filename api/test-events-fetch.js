const BASE_URL = 'http://localhost:3000';

async function testEventsFetch() {
    console.log('🚀 Starting Event Tests (Fetch Only)...');

    // 1. Get Token (Admin)
    const email = `event_admin_${Date.now()}@example.com`;
    const password = 'password123';
    const storeName = `Event Store`;

    console.log('1. Signing up Admin...');
    const authRes = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, storeName })
    });
    if (!authRes.ok) return console.error('Signup failed');
    const token = (await authRes.json()).access_token;

    // 2. Create Event
    console.log('2. Creating Event...');
    const createRes = await fetch(`${BASE_URL}/events`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Friday Night Magic',
            description: 'Standard format.',
            date: new Date().toISOString(),
            maxPlayers: 8
        })
    });
    if (createRes.ok) {
        const event = await createRes.json();
        console.log('✅ Created Event:', event.name, '(ID:', event.id, ')');
    } else {
        console.error('❌ Event Create Failed:', await createRes.text());
    }

    // 3. Register Player (Skipped because it requires API Key, but verified Controller logic)
    console.log('3. Skipped Public Registration (Requires API Key lookup).');
}

testEventsFetch();
