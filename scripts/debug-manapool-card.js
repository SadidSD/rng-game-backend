
const TOKEN = 'mpat_e8en2ug93ymnry741xuh6t62d';
const URL = 'https://manapool.com/api/v1/prices/singles';

async function checkCardPrice(cardName) {
    console.log(`Checking Manapool Price for: "${cardName}"...`);

    try {
        const response = await fetch(URL, {
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
        });

        if (response.status !== 200) {
            console.error('API Error:', response.status, await response.text());
            return;
        }

        const data = await response.json();
        const items = data.data || [];
        console.log(`Total Manapool Cards: ${items.length}`);

        // Find matches
        const matches = items.filter(i => i.name.toLowerCase().includes(cardName.toLowerCase()));

        if (matches.length === 0) {
            console.log('No matches found.');
        } else {
            console.log(`Found ${matches.length} matches:`);
            matches.forEach(m => {
                console.log('------------------------------------------------');
                console.log(`Name: ${m.name}`);
                console.log(`Set: ${m.set_name} (${m.set_code})`);
                console.log(`Scryfall ID: ${m.scryfall_id}`);
                console.log(`Collector Num: ${m.collector_number}`);
                console.log(`Price (Normal): ${m.price_cents ? '$' + (m.price_cents / 100).toFixed(2) : 'N/A'}`);
                console.log(`Price (Foil):   ${m.price_cents_foil ? '$' + (m.price_cents_foil / 100).toFixed(2) : 'N/A'}`);
                console.log(`Price (Etched): ${m.price_cents_etch ? '$' + (m.price_cents_etch / 100).toFixed(2) : 'N/A'}`);
            });
        }

    } catch (error) {
        console.error('Script Error:', error.message);
    }
}

checkCardPrice("Hardlight Containment");
