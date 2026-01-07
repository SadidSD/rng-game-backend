
const https = require('https');

const baseUrl = 'https://rng-game-backend-production.up.railway.app';
// Added '/api' prefix as per main.ts configuration
const endpoint = '/api/integrations/manapool/search';

// Query similar to what we'll use: query="Pikachu", game="Pokemon"
const params = new URLSearchParams({
    query: 'Pikachu',
    game: 'Pokemon'
});

const url = 'https://rng-game-backend-production.up.railway.app/api';

async function testProxy() {
    console.log(`Testing Public Endpoint: ${url}`);

    // Test Case: Sol Ring to check Set Codes
    const query = 'Sol Ring';
    const game = 'mtg';

    try {
        const fullUrl = `${url}/integrations/manapool/search?query=${encodeURIComponent(query)}&game=${game}`;
        console.log(`Fetching: ${fullUrl}`);

        const res = await fetch(fullUrl);
        console.log(`Status: ${res.status}`);

        const data = await res.json();

        if (data.data && Array.isArray(data.data)) {
            console.log(`Response Found: ${data.data.length} items for 'Sol Ring'`);

            // Log concise list
            data.data.forEach(item => {
                console.log(`- ${item.name} | Set: ${item.set_code} (${item.set_name}) | Price: $${item.price}`);
            });

        } else {
            console.log('Response (Structure mismatch):', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('Fetch failed:', error.message);
    }
}

testProxy();
