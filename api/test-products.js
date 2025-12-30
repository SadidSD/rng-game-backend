const BASE_URL = 'http://localhost:3000';

// Helper to get token (using auth details from verified test output if static, or re-login)
async function getAdminToken() {
    const email = `test_admin@example.com`; // We'll create a fresh one for consistency
    const password = 'password123';
    const storeName = 'Card Empire';

    // Try login first
    let res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
        // If login fails, try signup
        console.log('Login failed, creating new admin...');
        res = await fetch(`${BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, storeName })
        });
    }

    const data = await res.json();
    return data.access_token;
}

async function testProducts() {
    console.log('🚀 Starting Product Tests...');
    const token = await getAdminToken();
    if (!token) {
        console.error('❌ Failed to get token');
        return;
    }
    console.log('✅ Got Admin Token');

    // 1. Create Product
    console.log('\n1. Creating Product (Charizard)...');
    const productPayload = {
        name: 'Charizard',
        game: 'Pokemon',
        set: 'Base Set',
        variants: [
            { condition: 'NM', price: 500, quantity: 1, isFoil: true },
            { condition: 'HP', price: 100, quantity: 5 }
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
    console.log('✅ Created Product ID:', createdProduct.id);

    // 2. List Products
    console.log('\n2. Listing Products...');
    const listRes = await fetch(`${BASE_URL}/products?game=Pokemon`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const listData = await listRes.json();
    console.log(`✅ Found ${listData.length} products`);

    if (listData.length > 0) {
        console.log('Sample:', listData[0].name, listData[0].variants.length + ' variants');
    }
}

testProducts();
