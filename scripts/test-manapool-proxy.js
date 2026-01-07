
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

    // Test Case: Empty query to get EVERYTHING? 
    // The backend `manapool.service` fetches everything then filters.
    // If I pass query=' ', it filters by ' '.
    // Wait, the backend filters: `card.name.toLowerCase().includes(lowerQuery)`.
    // So I can't check the *total* cache size from the proxy easily without a backdoor or wide query.
    // I'll search for "e" (very common) to see if I get a lot of results.
    const query = 'e';
    const game = 'mtg';

    try {
        const fullUrl = `${url}/integrations/manapool/search?query=${encodeURIComponent(query)}&game=${game}`;
        console.log(`Fetching: ${fullUrl}`);

        const res = await fetch(fullUrl);
        console.log(`Status: ${res.status}`);

        const data = await res.json();

        if (data.data && Array.isArray(data.data)) {
            console.log(`Response Found: ${data.data.length} items with 'e'`);
            if (data.data.length > 0) {
                // Log ALL fields of the first item to check for images
                console.log('First Item Structure:', JSON.stringify(data.data[0], null, 2));
            }
        } else {
            console.log('Response (Structure mismatch):', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('Fetch failed:', error.message);
    }
}

testProxy();
