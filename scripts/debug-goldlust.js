const axios = require('axios');

// Manapool Configuration
const BASE_URL = 'https://manapool.com/api/v1';
// Note: We need the actual token. Since I can't read .env easily in this context without dotenv, 
// I will rely on the user having it in their environment or I'll try to read it from the open file if possible.
// Actually, `run_command` environment usually inherits or I can try to read process.env if I run with `node -r dotenv/config`.
// Let's assume the user has the token set in their terminal session or I'll try to find it.
// Wait, I can't see the token. 
// I will try to read it from .env file directly in the script.

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env from api/.env
const envPath = path.resolve(__dirname, '../api/.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const ACCESS_TOKEN = process.env.MANAPOOL_ACCESS_TOKEN;

async function debugGoldlust() {
    if (!ACCESS_TOKEN) {
        console.error('❌ MANAPOOL_ACCESS_TOKEN not found in environment or .env file');
        process.exit(1);
    }

    console.log(`[Debug] Searching Manapool for "Goldlust Triad"...`);
    try {
        const response = await axios.get(`${BASE_URL}/prices/singles`, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const allCards = response.data.data || [];
        console.log(`[Debug] Fetched ${allCards.length} total cards.`);

        // Search for Goldlust Triad
        const matches = allCards.filter(c => c.name.toLowerCase().includes('goldlust triad'));

        if (matches.length === 0) {
            console.log('❌ No matches found for "Goldlust Triad"');
        } else {
            console.log(`✅ Found ${matches.length} matches:`);
            matches.forEach(m => {
                console.log('------------------------------------------------');
                console.log(`Name: ${m.name}`);
                console.log(`Set: ${m.set_name} (${m.set_code})`);
                console.log(`Scryfall ID: ${m.scryfall_id}`);
                console.log(`Price (cents): ${m.price_cents}`);
                console.log(`Foil Price (cents): ${m.price_cents_foil}`);
                console.log(`Etched Price (cents): ${m.price_cents_etch}`);
                console.log('------------------------------------------------');
            });
        }

    } catch (error) {
        console.error('❌ API Request Failed:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

debugGoldlust();
