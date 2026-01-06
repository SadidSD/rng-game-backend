
const https = require('https');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const apiKey = process.argv[2];
if (!apiKey) {
    console.error('Usage: node inspect-manapool.js <YOUR_API_KEY>');
    process.exit(1);
}

const baseUrl = 'https://manapool.com/api/v1';

// Function to make a request
function checkEndpoint(endpoint, params) {
    const url = new URL(`${baseUrl}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));

    console.log(`\nTesting: ${url.toString()}`);

    const options = {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
        }
    };

    https.get(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`Status: ${res.statusCode}`);
            try {
                const json = JSON.parse(data);
                // Log the first item or a summary to check structure
                if (Array.isArray(json)) {
                    console.log('Response (Array):', JSON.stringify(json.slice(0, 1), null, 2));
                } else if (json.data && Array.isArray(json.data)) {
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
}

// Test 1: Simple Name Search (for price pricing)
checkEndpoint('/cards', { name: 'Pikachu', sort: 'price', order: 'asc' });

// Test 2: Advanced Search (Card + Set Code)
// Trying to match a specific Scryfall/PokemonTCG card to Manapool
// "Black Lotus" from "Limited Edition Alpha" (LEA)
// Note: Manapool might use different set codes, but this is a good test.
checkEndpoint('/cards', { search: 'Black Lotus #set:LEA' });

// Test 3: ID Lookup (if we ever get Manapool IDs)
// checkEndpoint('/cards/12345', {});

