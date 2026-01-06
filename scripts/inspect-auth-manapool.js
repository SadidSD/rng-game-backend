
const https = require('https');

const apiKey = process.argv[2];
if (!apiKey) {
    console.error('Usage: node inspect-auth-manapool.js <YOUR_API_KEY>');
    process.exit(1);
}

const hostname = 'manapool.com';
const path = '/api/v1/prices/singles';

function testAuth(prefix, headerName = 'Authorization') {
    const authHeader = prefix ? `${prefix} ${apiKey}` : apiKey;

    console.log(`Testing Header: ${headerName}: ${prefix ? prefix + ' ' : ''}[REDACTED]`);

    const options = {
        hostname: hostname,
        path: path,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            [headerName]: authHeader
        }
    };

    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (d) => body += d);
        res.on('end', () => {
            console.log(`Status: ${res.statusCode}`);
            if (res.statusCode === 200) {
                console.log('SUCCESS!');
                // Log first 500 chars to see structure
                console.log('Response:', body.substring(0, 500) + '...');
            } else {
                console.log('Error:', body.substring(0, 300));
            }
            console.log('---');
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.end();
}

// Test cases
testAuth('Bearer');       // Standard
testAuth(null, 'x-api-key'); // Custom header
testAuth(null);           // Just token in Auth header
