const https = require('https');

const paths = [
    '/',
    '/api',
    '/products', // Maybe no global prefix?
    '/public/products', // Maybe no global prefix?
    '/api/public/products' // Expected
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
            console.log(`[${path}] Status: ${res.statusCode}`);
            if (res.statusCode === 200 || res.statusCode === 404) {
                console.log(`[${path}] Body: ${data.substring(0, 150)}...`);
            }
        });
    });

    req.on('error', e => console.error(e));
    req.end();
});
