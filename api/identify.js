const https = require('https');

const options = {
    hostname: 'tcg-backend.up.railway.app',
    port: 443,
    path: '/api/public/products',
    method: 'GET',
    headers: { 'x-api-key': 'tcg-frontend-secret-key' }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        console.log(`STATUS: ${res.statusCode}`);
        try {
            console.log('BODY:', JSON.stringify(JSON.parse(data), null, 2));
        } catch (e) {
            console.log('BODY (Raw):', data);
        }
    });
});

req.on('error', e => console.error(e));
req.end();
