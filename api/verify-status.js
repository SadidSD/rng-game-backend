const https = require('https');

const options = {
    hostname: 'tcg-backend.up.railway.app',
    port: 443,
    path: '/api/public/products',
    method: 'GET',
    headers: {
        'x-api-key': 'tcg-frontend-secret-key'
    }
};

console.log(`Checking ${options.method} https://${options.hostname}${options.path}...`);

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode} ${res.statusMessage}`);
    console.log('HEADERS:', JSON.stringify(res.headers, null, 2));

    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('BODY SAMPLE:', data.substring(0, 300));
    });
});

req.on('error', (e) => {
    console.error(`REQUEST ERROR: ${e.message}`);
});

req.end();
