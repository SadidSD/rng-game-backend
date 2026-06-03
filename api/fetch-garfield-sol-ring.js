const axios = require('axios');

async function main() {
    try {
        const query = 'Sol Ring set:sld';
        const res = await axios.get('https://api.scryfall.com/cards/search', {
            params: {
                q: query
            },
            headers: {
                'User-Agent': 'TCG-SaaS-Client/1.0',
                'Accept': 'application/json'
            }
        });
        
        const cards = res.data.data || [];
        console.log(`Found ${cards.length} prints for "${query}"`);
        
        cards.forEach((card, index) => {
            console.log(`[Card ${index + 1}] Name: "${card.name}", Set: "${card.set_name}", Collector Num: ${card.collector_number}`);
            console.log(`  Finishes:`, card.finishes);
            console.log(`  Prices:`, card.prices);
        });
    } catch (e) {
        console.error(e.message);
    }
}

main();
