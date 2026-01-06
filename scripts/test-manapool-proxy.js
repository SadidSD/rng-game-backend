
const https = require('https');

const baseUrl = 'https://rng-game-backend-production.up.railway.app';
// Added '/api' prefix as per main.ts configuration
const endpoint = '/api/integrations/manapool/search';

// Query similar to what we'll use: query="Pikachu", game="Pokemon"
const params = new URLSearchParams({
    query: 'Pikachu',
    game: 'Pokemon'
});

const url = `${baseUrl}${endpoint}?${params.toString()}`;

console.log(`Testing Public Endpoint: ${url}`);

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        try {
            const json = JSON.parse(data);
            // Log structure to identify price fields
            if (Array.isArray(json)) {
                console.log('Response (Array):', JSON.stringify(json.slice(0, 1), null, 2));
            } else if (json.data) {
                console.log('Response (Paged):', JSON.stringify(json.data.slice(0, 1), null, 2));
            } else {
                console.log('Response:', JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.log('Raw Body:', data);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
