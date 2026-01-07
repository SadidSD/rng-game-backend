
const url = 'https://rng-game-backend-production.up.railway.app/api';

async function debugMatch() {
    const query = 'Sol Ring';
    console.log(`Debugging Match for: ${query}`);

    // 1. Fetch Scryfall Data (as Frontend does)
    // Note: The frontend calls /api/proxy/mtg, which calls Scryfall directly or via backend?
    // The frontend calls `/api/proxy/mtg`. Let's assume that proxy calls Scryfall.
    // Wait, the frontend proxy is NEXTJS. I can't call it from here easily.
    // I should call the BACKEND Proxy if it exists? 
    // Ah, the frontend `api/proxy/mtg` calls the NEXTJS route.
    // But I have `api/proxy/mtg/route.ts` which calls `Scryfall` directly.
    // I will simulate the Scryfall call here using the same URL as `route.ts`.

    // Simulating Scryfall Fetch
    console.log('Fetching Scryfall Data...');
    const scryfallUrl = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints&order=released`;
    const scryReq = await fetch(scryfallUrl);
    const scryData = await scryReq.json();
    const scryCards = scryData.data || [];
    console.log(`Scryfall found ${scryCards.length} cards.`);

    // 2. Fetch Manapool Data (as Frontend does via Proxy -> Backend)
    console.log('Fetching Manapool Data...');
    const mpUrl = `${url}/integrations/manapool/search?query=${encodeURIComponent(query)}&game=mtg`;
    const mpReq = await fetch(mpUrl);
    const mpData = await mpReq.json();
    const mpPrices = mpData.data || [];
    console.log(`Manapool found ${mpPrices.length} prices.`);

    // 3. Test Matching Logic
    let matches = 0;
    scryCards.slice(0, 5).forEach(card => {
        // Frontend logic: match = manapoolPrices.find(p => p.scryfall_id === card.id);
        const match = mpPrices.find(p => p.scryfall_id === card.id);
        console.log(`Card: ${card.name} [${card.set}] ID: ${card.id} => Match? ${match ? 'YES ($' + match.price_cents / 100 + ')' : 'NO'}`);
        if (match) matches++;

        // Debug mis-match
        if (!match) {
            // Find matches by name to see if IDs are different
            const nameMatch = mpPrices.find(p => p.name === card.name);
            if (nameMatch) {
                console.log(`   -> Found Name Match! But IDs differ. Scryfall: ${card.id} vs Manapool: ${nameMatch.scryfall_id}`);
            }
        }
    });

    console.log(`Total Matches in first 5: ${matches}`);

    // Log sample IDs
    if (mpPrices.length > 0) console.log('Sample Manapool ID:', mpPrices[0].scryfall_id);
    if (scryCards.length > 0) console.log('Sample Scryfall ID:', scryCards[0].id);
}

debugMatch();
