
const url = 'https://rng-game-backend-production.up.railway.app/api';

async function probe() {
    console.log(`Probing: ${url}`);

    // 1. Check Root
    try {
        const root = await fetch('https://rng-game-backend-production.up.railway.app/');
        const rootJson = await root.json();
        console.log('Root "/" Status:', root.status, rootJson);
    } catch (e) {
        console.log('Root "/" Failed:', e.message);
    }

    // 2. Check Categories (CORS Issue reported)
    try {
        const cats = await fetch(`${url}/categories`);
        console.log('GET /categories Status:', cats.status);
        if (cats.status === 200) {
            const data = await cats.json();
            console.log(`- Found ${data.length} categories.`);
        }
    } catch (e) {
        console.log('GET /categories Failed:', e.message);
    }

    // 3. Check Manapool Search (Empty list reported)
    try {
        // Query from log: "Hardlight Containment"
        const query = 'Hardlight Containment';
        const searchUrl = `${url}/integrations/manapool/search?query=${encodeURIComponent(query)}&game=mtg`;
        console.log(`GET /integrations/manapool/search?query='${query}'`);

        const search = await fetch(searchUrl);
        console.log('Search Status:', search.status);

        if (search.status === 200) {
            const data = await search.json();
            console.log(`- Found ${data.data ? data.data.length : 0} items.`);
            if (data.data && data.data.length > 0) {
                console.log('- First Match:', data.data[0].name);
            } else {
                console.log('- Response Data:', JSON.stringify(data, null, 2));
            }
        }
    } catch (e) {
        console.log('GET /search Failed:', e.message);
    }
}

probe();
