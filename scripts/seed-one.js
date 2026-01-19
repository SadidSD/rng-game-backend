const path = require('path');
// unexpected quirks in mono-repos: try to load from api/node_modules if root fails
let PrismaClient, axios;

console.log('📦 Loading dependencies...');
try {
    PrismaClient = require('@prisma/client').PrismaClient;
    axios = require('axios');
    console.log('✅ Loaded from default paths');
} catch (e) {
    console.log('⚠️ Default load failed, trying ../api/node_modules...');
    try {
        PrismaClient = require('../api/node_modules/@prisma/client').PrismaClient;
        axios = require('../api/node_modules/axios');
        if (axios.default) axios = axios.default; // Handle ESM default export quirk
        console.log('✅ Loaded from api/node_modules (Type:', typeof axios, axios.get ? 'has-get' : 'no-get', ')');
    } catch (e2) {
        console.error('❌ Failed to load modules:', e2.message);
        process.exit(1);
    }
}

// Load Env
try {
    require('dotenv').config({ path: path.join(__dirname, '../api/.env') });
} catch (e) {
    try {
        require('../api/node_modules/dotenv').config({ path: path.join(__dirname, '../api/.env') });
    } catch (e2) {
        console.log('⚠️ Could not load dotenv, relying on system env vars');
    }
}

const prisma = new PrismaClient();
const STORE_ID = process.env.SINGLE_TENANT_STORE_ID || 'd02dbcba-81b5-4f9d-831c-54fe9a803081';

async function main() {
    console.log(`🔌 Connecting to DB (Store: ${STORE_ID})...`);

    // Verify DB Connection
    try {
        const store = await prisma.store.findUnique({ where: { id: STORE_ID } });
        if (!store) {
            console.log('⚠️ Store not found, creating default...');
            await prisma.store.create({
                data: { id: STORE_ID, name: 'Default Store', apiKey: 'seed-test-key' }
            });
        }
        console.log('✅ DB Connected & Store Verified');
    } catch (e) {
        console.error('❌ DB Connection Failed:', e.message);
        return;
    }

    const cardName = "Sol Ring";
    console.log(`🔍 Fetching "${cardName}" from Scryfall...`);

    try {
        const url = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`;
        const res = await axios.get(url);
        const card = res.data;

        console.log(`✅ Found: ${card.name} (${card.set_name})`);

        console.log('💾 Saving to Database...');
        await prisma.buylistFeaturedCard.create({
            data: {
                storeId: STORE_ID,
                name: card.name,
                set: card.set_name,
                setId: card.set,
                game: 'MTG',
                image: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || '',
                basePrice: card.prices?.usd ? Number(card.prices.usd) : 0
            }
        });

        console.log('🎉 Success! Card added to Buylist.');
    } catch (e) {
        console.error('❌ Failed:', e.message);
        if (e.response) console.error('Response:', e.response.data);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
