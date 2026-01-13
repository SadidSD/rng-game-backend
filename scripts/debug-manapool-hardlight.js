
const TOKEN = 'mpat_e8en2ug93ymnry741xuh6t62d';
const URL = 'https://manapool.com/api/v1/prices/singles';

async function deepDebug() {
    console.log("Fetching Manapool Data...");
    try {
        const response = await fetch(URL, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const data = await response.json();
        const items = data.data || [];

        console.log(`Total Items: ${items.length}`);

        // Filter specifically for Hardlight Containment
        const matches = items.filter(i => i.name.toLowerCase().includes("hardlight containment"));

        console.log(`Found ${matches.length} entries for 'Hardlight Containment':`);
        console.log("==================================================");

        matches.forEach((m, idx) => {
            console.log(`Entry #${idx + 1}`);
            console.log(`Name:        ${m.name}`);
            console.log(`Set:         ${m.set_name} (${m.set_code})`);
            console.log(`Scryfall ID: ${m.scryfall_id}`);
            console.log(`Coll. Num:   ${m.collector_number}`);
            console.log(`Price USD:   ${m.price_cents ? (m.price_cents / 100).toFixed(2) : 'null'}`);
            console.log(`Price Foil:  ${m.price_cents_foil ? (m.price_cents_foil / 100).toFixed(2) : 'null'}`);
            console.log(`Price Etch:  ${m.price_cents_etch ? (m.price_cents_etch / 100).toFixed(2) : 'null'}`);
            console.log("--------------------------------------------------");
        });

    } catch (e) {
        console.error(e);
    }
}

deepDebug();
