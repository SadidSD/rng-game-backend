const BASE_URL = 'http://localhost:3000';

async function testUploadsFetch() {
    console.log('🚀 Starting Upload Tests (Fetch Only)...');

    // 1. Get Token (Admin)
    const email = `upload_admin_${Date.now()}@example.com`;
    const password = 'password123';
    const storeName = `Upload Store`;

    console.log('1. Signing up Admin...');
    const authRes = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, storeName })
    });
    if (!authRes.ok) return console.error('Signup failed');
    const token = (await authRes.json()).access_token;

    // 2. Upload File (Simulated)
    // Converting text to blob for simulation
    const blob = new Blob(['Fake Image Content'], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', blob, 'test-image.txt');

    console.log('2. Uploading File...');
    const uploadRes = await fetch(`${BASE_URL}/uploads`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    if (uploadRes.ok) {
        const data = await uploadRes.json();
        console.log('✅ Upload Success:', data.url);
    } else {
        console.error('❌ Upload Failed:', await uploadRes.text());
    }
}

testUploadsFetch();
