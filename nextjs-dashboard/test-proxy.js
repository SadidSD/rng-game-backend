const { GET } = require('./app/api/proxy/mtg/route');

async function test() {
    const req = {
        url: 'http://localhost:3000/api/proxy/mtg?query=Sol%20Ring'
    };
    
    try {
        const response = await GET(req);
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Results count:', data.data?.length);
        if (data.data && data.data.length > 0) {
            const firstCard = data.data[0];
            console.log('First card name:', firstCard.name);
            console.log('First card prices:', firstCard.prices);
            console.log('First card finishes:', firstCard.finishes);
        } else {
            console.log('No cards returned. Full response:', data);
        }
    } catch (e) {
        console.error('Error testing proxy:', e);
    }
}

test();
