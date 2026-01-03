const https = require('https');

// Paths to check
const paths = [
    '/api',
    '/api/public/products'
];

paths.forEach(path => {
    const options = {
        hostname: 'tcg-backend.up.railway.app',
        port: 443,
        path: path,
        method: 'GET',
        headers: { 'x-api-key': 'tcg-frontend-secret-key' }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            console.log(`\n--- PROBE: ${path} ---`);
            console.log(`STATUS: ${res.statusCode}`);
            // Print first 500 chars to identify the responder
            console.log('BODY:', data.substring(0, 500));
        });
    });

    req.on('error', e => console.error(e));
    req.end();
});
