

async function debugPrices() {
    // Search for Sol Ring from Secret Lair Drop (SLD) #0913
    const query = 'Sol Ring set:sld cn:913';
    const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`;

    console.log(`Fetching: ${url}`);

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.data && data.data.length > 0) {
            const card = data.data[0];
            console.log(`Found Card: ${card.name} (${card.set.toUpperCase()} #${card.collector_number})`);
            console.log('Prices Object:', JSON.stringify(card.prices, null, 2));
            console.log('Finishes:', JSON.stringify(card.finishes, null, 2));
        } else {
            console.log('Card not found.');
        }

    } catch (error) {
        console.error('Error fetching data:', error.message);
    }
}

debugPrices();
