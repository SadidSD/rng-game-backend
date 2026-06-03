async function test() {
    try {
        const url = 'https://rng-game-backend-six.vercel.app/api/proxy/mtg?query=Sol%20Ring%20set:sld';
        console.log('Fetching:', url);
        const res = await fetch(url);
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Data returned:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();
