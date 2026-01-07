
const url = 'https://rng-game-backend-production.up.railway.app/api';

async function debugFullMatch() {
    const query = 'Sol Ring';
    const targetSet = 'znc'; // Zendikar Rising Commander

    console.log(`Debugging Match for: ${query} [${targetSet}]`);

    // 1. Fetch from Scryfall (Simulating Frontend Search)
    console.log('Fetching Scryfall Data...');
    const scryUrl = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query + ' set:' + targetSet)}&unique=prints`;
    const scryReq = await fetch(scryUrl);
    const scryData = await scryReq.json();
    const scryCard = scryData.data ? scryData.data[0] : null;

    if (!scryCard) {
        console.error('Scryfall did not find Sol Ring ZNC!');
        return;
    }

    console.log(`Scryfall Card: ${scryCard.name}`);
    console.log(`- ID: ${scryCard.id}`);
    console.log(`- Set: ${scryCard.set}`);
    console.log(`- Name: ${scryCard.name}`);

    // 2. Fetch from Manapool (Backend Proxy)
    console.log('\nFetching Manapool Data...');
    const mpUrl = `${url}/integrations/manapool/search?query=${encodeURIComponent(query)}&game=mtg`;
    const mpReq = await fetch(mpUrl);
    const mpData = await mpReq.json();
    const mpPrices = mpData.data || [];

    // 3. Find Matches
    console.log(`\nSearching Manapool results (${mpPrices.length} found) for ZNC match...`);

    const idMatch = mpPrices.find(p => p.scryfall_id === scryCard.id);
    const nameSetMatch = mpPrices.find(p =>
        p.name.toLowerCase() === scryCard.name.toLowerCase() &&
        p.set_code.toLowerCase() === scryCard.set.toLowerCase()
    );

    console.log(`- ID Match: ${idMatch ? 'YES ($' + idMatch.price + ')' : `NO (Looking for ${scryCard.id})`}`);
    console.log(`- Name+Set Match: ${nameSetMatch ? 'YES ($' + nameSetMatch.price + ')' : `NO (Looking for ${scryCard.name} + ${scryCard.set})`}`);

    // Log potential partial matches
    const setMatches = mpPrices.filter(p => p.set_code.toLowerCase() === targetSet);
    if (setMatches.length > 0) {
        console.log(`\nFound items with set 'ZNC' in Manapool:`);
        setMatches.forEach(p => {
            console.log(`- Name: "${p.name}" | ID: ${p.scryfall_id} | Set: ${p.set_code}`);
        });
    } else {
        console.log(`\nNo items with set 'ZNC' found in Manapool response.`);
    }
}

debugFullMatch();
