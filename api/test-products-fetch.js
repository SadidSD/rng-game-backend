const BASE_URL = 'http://localhost:3000';

async function testProductsFetch() {
    console.log('🚀 Starting Product Tests (Fetch Only)...');

    // 1. Get Token (Login or Signup)
    const email = `admin_${Date.now()}@example.com`;
    const password = 'password123';
    const storeName = `Store ${Date.now()}`;

    console.log('1. Signing up new admin...');
    let authRes = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, storeName })
    });

    if (!authRes.ok) {
        console.error('❌ Signup failed:', await authRes.text());
        return;
    }
    const authData = await authRes.json();
    const token = authData.access_token;
    console.log('✅ Signup complete. Token received.');

    // 2. Create Product
    console.log('\n2. Creating Product...');
    const productPayload = {
        name: 'Black Lotus',
        game: 'MTG',
        set: 'Alpha',
        variants: [
            { condition: 'NM', price: 50000, quantity: 1 }
        ]
    };

    const createRes = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productPayload)
    });

    if (!createRes.ok) {
        console.error('❌ Create Failed:', await createRes.text());
        return;
    }
    const createdProduct = await createRes.json();
    console.log('✅ Created Product:', createdProduct.name, '(ID:', createdProduct.id, ')');

    // 3. List Products
    console.log('\n3. Listing Products...');
    const listRes = await fetch(`${BASE_URL}/products?game=MTG`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const listData = await listRes.json();
    console.log(`✅ Found ${listData.length} products`);

    if (listData.length > 0 && listData[0].name === 'Black Lotus') {
        console.log('✅ Verified: Black Lotus is in the list.');
    } else {
        console.error('❌ Product verification failed.');
    }
}

testProductsFetch();
