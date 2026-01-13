
const TOKEN = 'mpat_e8en2ug93ymnry741xuh6t62d';
const URL = 'https://manapool.com/api/v1/prices/singles';

async function checkManapool() {
    console.log(`Checking Manapool API at: ${URL}`);
    console.log(`Using Token: ${TOKEN.substring(0, 5)}...`);

    try {
        const start = Date.now();
        const response = await fetch(URL, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        const duration = Date.now() - start;

        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Duration: ${duration}ms`);

        if (response.status === 200) {
            const data = await response.json();
            if (data && data.data) {
                console.log(`Success! Retrieved ${data.data.length} items.`);
                if (data.data.length > 0) {
                    console.log('Sample Item:', data.data[0]);
                }
            } else {
                console.log('Response format unexpected:', JSON.stringify(data, null, 2));
            }
        } else {
            console.error('API Call Failed!');
            const text = await response.text();
            console.error('Response Body:', text);
        }

    } catch (error) {
        console.error('Network Error:', error.message);
    }
}

checkManapool();
