const axios = require('axios');

const API_URL = 'https://rng-game-backend.onrender.com/api';
const API_KEY = 'tcg-frontend-secret-key';

async function main() {
    const payload = {
        customerName: "Debug User",
        customerEmail: "debug@example.com",
        items: [
            {
                cardName: "Debug Card",
                condition: "NM",
                isFoil: false,
                offerPrice: 10.00,
                quantity: 1
            }
        ]
    };

    try {
        console.log(`Sending to ${API_URL}/buylist/offers...`);
        const res = await axios.post(`${API_URL}/buylist/offers`, payload, {
            headers: { 'x-api-key': API_KEY }
        });
        console.log('Success:', res.status, res.data);
    } catch (error) {
        if (error.response) {
            console.error('Error:', error.response.status, error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

main();
