
const fs = require('fs');

const url = 'https://rng-game-backend-production.up.railway.app/api';

async function dump() {
    console.log(`Fetching from: ${url}`);
    const query = 'e'; // Wide search
    const game = 'mtg';

    try {
        const fullUrl = `${url}/integrations/manapool/search?query=${encodeURIComponent(query)}&game=${game}`;
        const res = await fetch(fullUrl);
        const data = await res.json();

        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            // Write first 3 items to file
            const sample = data.data.slice(0, 3);
            fs.writeFileSync('manapool-dump.json', JSON.stringify(sample, null, 2));
            console.log('Dumped 3 items to manapool-dump.json');
        } else {
            console.log('No data found to dump.');
        }

    } catch (error) {
        console.error('Fetch failed:', error.message);
    }
}

dump();
