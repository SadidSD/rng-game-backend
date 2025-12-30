const BASE_URL = 'http://localhost:3000';

async function testCustomersFetch() {
    console.log('🚀 Starting Customer Tests (Fetch Only)...');

    // 1. Get Token (Admin)
    const email = `cust_admin_${Date.now()}@example.com`;
    const password = 'password123';
    const storeName = `Customer Store`;

    console.log('1. Signing up Admin...');
    const authRes = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, storeName })
    });
    if (!authRes.ok) return console.error('Signup failed');
    const token = (await authRes.json()).access_token;

    // 2. Create Customer
    console.log('2. Creating Customer manually...');
    const customerEmail = `john.doe.${Date.now()}@example.com`;
    const createRes = await fetch(`${BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: customerEmail,
            firstName: 'John',
            lastName: 'Doe',
            notes: 'VIP Client'
        })
    });
    const customer = await createRes.json();
    console.log('✅ Created Customer:', customer.email, '(ID:', customer.id, ')');

    // 3. Search Customer
    console.log('3. Searching for "John"...');
    const searchRes = await fetch(`${BASE_URL}/customers?search=John`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const results = await searchRes.json();
    console.log('✅ Search Results:', results.length);

    if (results.some(c => c.email === customerEmail)) {
        console.log('✅ Found matching customer in search.');
    } else {
        console.error('❌ Could not find created customer in search results.');
    }

    // 4. Get Details
    console.log('4. Getting Details...');
    const detailRes = await fetch(`${BASE_URL}/customers/${customer.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const detail = await detailRes.json();
    if (detail.notes === 'VIP Client') {
        console.log('✅ Details Verified (Notes match).');
    } else {
        console.error('❌ Notes mismatch:', detail.notes);
    }
}

testCustomersFetch();
