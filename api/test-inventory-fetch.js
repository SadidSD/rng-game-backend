const BASE_URL = 'http://localhost:3000';

async function testInventoryFetch() {
    console.log('🚀 Starting Inventory Tests (Fetch Only)...');

    // 1. Get Token
    const email = `inv_test_${Date.now()}@example.com`;
    const password = 'password123';
    const storeName = `Inventory Store`;

    console.log('1. Signing up...');
    const authRes = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, storeName })
    });
    if (!authRes.ok) return console.error('Signup failed');
    const token = (await authRes.json()).access_token;

    // 2. Create Product with initial stock 10
    console.log('2. Creating Product (Stock 10)...');
    const prodRes = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Inventory Card',
            game: 'Test',
            variants: [{ condition: 'NM', price: 10, quantity: 10 }]
        })
    });
    const product = await prodRes.json();
    const variantId = product.variants[0].id; // We need this ID to target inventory path
    console.log('   Variant ID:', variantId);

    // 3. Remove 2 items (Atomic Update)
    console.log('3. Selling 2 items (Action: REMOVE)...');
    const updateRes = await fetch(`${BASE_URL}/inventory/${variantId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'REMOVE',
            quantity: 2,
            reason: 'Sold to customer'
        })
    });
    const updatedItem = await updateRes.json();
    console.log('   New Quantity:', updatedItem.quantity);

    if (updatedItem.quantity === 8) {
        console.log('✅ PASS: Stock correctly reduced to 8.');
    } else {
        console.error('❌ FAIL: Expected 8, got', updatedItem.quantity);
    }

    // 4. Set Stock to 100
    console.log('4. Restock (Action: SET 100)...');
    const setRes = await fetch(`${BASE_URL}/inventory/${variantId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'SET',
            quantity: 100
        })
    });
    const setItem = await setRes.json();
    console.log('   New Quantity:', setItem.quantity);

    if (setItem.quantity === 100) {
        console.log('✅ PASS: Stock set to 100.');
    } else {
        console.error('❌ FAIL: Expected 100, got', setItem.quantity);
    }
}

testInventoryFetch();
