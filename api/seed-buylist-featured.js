/**
 * seed-buylist-featured.js
 * Fetches 300 iconic MTG cards from Scryfall and seeds them into BuylistFeaturedCard.
 * These cards appear ONLY on the buylist page — not in the shop.
 *
 * Usage:  node seed-buylist-featured.js
 */

const { PrismaClient } = require('@prisma/client');

// ─── Runtime DATABASE_URL fix (same as prisma.service.ts) ─────────────────────
function getPoolerUrl(url) {
    if (!url) return url;
    let fixed = url.replace(/:5432\//, ':6543/');
    if (!fixed.includes('pgbouncer=true')) {
        fixed += (fixed.includes('?') ? '&' : '?') + 'pgbouncer=true';
    }
    if (!fixed.includes('connection_limit=')) {
        fixed += '&connection_limit=3';
    }
    return fixed;
}

const prisma = new PrismaClient({
    datasources: { db: { url: getPoolerUrl(process.env.DATABASE_URL) } },
});

// ─── 300 Iconic MTG Card Names ─────────────────────────────────────────────────
const ICONIC_CARDS = [
    // Power Nine
    'Black Lotus', 'Mox Sapphire', 'Mox Ruby', 'Mox Pearl', 'Mox Emerald',
    'Mox Jet', 'Ancestral Recall', 'Time Walk', 'Timetwister',

    // Commander / EDH Staples
    'Sol Ring', 'Command Tower', 'Arcane Signet', 'Lightning Greaves',
    'Swiftfoot Boots', 'Cultivate', 'Kodama\'s Reach', 'Cyclonic Rift',
    'Rhystic Study', 'Smothering Tithe', 'Counterspell', 'Swords to Plowshares',
    'Path to Exile', 'Demonic Tutor', 'Vampiric Tutor', 'Mystical Tutor',
    'Enlightened Tutor', 'Worldly Tutor', 'Nature\'s Claim', 'Beast Within',
    'Heroic Intervention', 'Bojuka Bog', 'Reliquary Tower', 'Solemn Simulacrum',
    'Thran Dynamo', 'Coalition Relic', 'Mana Vault', 'Grim Monolith',
    'Chrome Mox', 'Mox Diamond', 'Mox Opal', 'Mox Amber',
    'Ancient Tomb', 'Strip Mine', 'Wasteland', 'Cabal Coffers',
    'Urborg, Tomb of Yawgmoth', 'Nykthos, Shrine to Nyx', 'Cavern of Souls',
    'Reflecting Pool', 'Darksteel Forge', 'Sensei\'s Divining Top',

    // Top Planeswalkers
    'Jace, the Mind Sculptor', 'Liliana of the Veil', 'Tarmogoyf',
    'Dark Confidant', 'Snapcaster Mage', 'Vendilion Clique',
    'Force of Will', 'Daze', 'Brainstorm', 'Ponder', 'Preordain',
    'Mental Misstep', 'Mana Drain', 'Spell Pierce', 'Swan Song',
    'Flusterstorm', 'Force of Negation',

    // Fetch Lands
    'Polluted Delta', 'Flooded Strand', 'Windswept Heath', 'Wooded Foothills',
    'Bloodstained Mire', 'Scalding Tarn', 'Misty Rainforest', 'Verdant Catacombs',
    'Marsh Flats', 'Arid Mesa',

    // Shock Lands
    'Steam Vents', 'Watery Grave', 'Blood Crypt', 'Stomping Ground',
    'Temple Garden', 'Hallowed Fountain', 'Godless Shrine', 'Sacred Foundry',
    'Breeding Pool', 'Overgrown Tomb',

    // Dual Lands
    'Tropical Island', 'Underground Sea', 'Tundra', 'Volcanic Island',
    'Bayou', 'Badlands', 'Savannah', 'Scrubland', 'Taiga', 'Plateau',

    // Modern Staples
    'Thoughtseize', 'Inquisition of Kozilek', 'Fatal Push', 'Lightning Bolt',
    'Monastery Swiftspear', 'Goblin Guide', 'Death\'s Shadow', 'Street Wraith',
    'Mishra\'s Bauble', 'Urza\'s Saga', 'Ragavan, Nimble Pilferer',
    'Dragon\'s Rage Channeler', 'Murktide Regent', 'Ledger Shredder',
    'Solitude', 'Subtlety', 'Endurance', 'Fury', 'Grief',
    'Teferi, Time Raveler', 'Teferi, Hero of Dominaria',

    // Legacy Staples
    'Delver of Secrets', 'True-Name Nemesis', 'Wasteland', 'Show and Tell',
    'Emrakul, the Aeons Torn', 'Omniscience', 'Griselbrand',
    'Reanimator', 'Entomb', 'Reanimate', 'Animate Dead',
    'Stifle', 'Vial Smasher the Fierce', 'Leovold, Emissary of Trest',
    'Deathrite Shaman', 'Noble Hierarch', 'Birds of Paradise',
    'Green Sun\'s Zenith', 'Natural Order', 'Craterhoof Behemoth',

    // Top Commanders
    'The Ur-Dragon', 'Atraxa, Praetors\' Voice', 'Nekusar, the Mindrazer',
    'Muldrotha, the Gravetide', 'Kenrith, the Returned King',
    'Prosper, Tome-Bound', 'Lathril, Blade of the Elves',
    'Omnath, Locus of Creation', 'Omnath, Locus of Mana',
    'Chulane, Teller of Tales', 'Edgar Markov', 'Korvold, Fae-Cursed King',
    'Golos, Tireless Pilgrim', 'Kaalia of the Vast', 'Meren of Clan Nel Toth',
    'Yuriko, the Tiger\'s Shadow', 'Zur the Enchanter', 'Najeela, the Blade-Blossom',
    'Ghave, Guru of Spores', 'Riku of Two Reflections',

    // Iconic Creatures
    'Emrakul, the Promised End', 'Ulamog, the Ceaseless Hunger',
    'Kozilek, Butcher of Truth', 'Blightsteel Colossus',
    'Jin-Gitaxias, Core Augur', 'Sheoldred, the Apocalypse',
    'Phyrexian Obliterator', 'Grave Titan', 'Frost Titan', 'Inferno Titan',
    'Sun Titan', 'Primeval Titan', 'Consecrated Sphinx',
    'Iona, Shield of Emeria', 'Linvala, Keeper of Silence',
    'Avacyn, Angel of Hope', 'Platinum Emperion', 'Blightsteel Colossus',

    // Powerful Enchantments / Artifacts
    'Sylvan Library', 'Survival of the Fittest', 'Necropotence',
    'Yawgmoth\'s Will', 'Timetwister', 'Time Spiral',
    'The Tabernacle at Pendrell Vale', 'Moat', 'The Abyss',
    'Chains of Mephistopheles', 'Gilded Drake', 'Tolarian Academy',
    'Library of Alexandria', 'Mishra\'s Workshop',
    'Bazaar of Baghdad', 'Maze of Ith',

    // Standard / Pioneer Staples
    'Fable of the Mirror-Breaker', 'Wedding Announcement', 'The Meathook Massacre',
    'Liliana of the Last Hope', 'Wrenn and Six', 'Oko, Thief of Crowns',
    'Once Upon a Time', 'Fires of Invention', 'Wilderness Reclamation',
    'Uro, Titan of Nature\'s Wrath', 'Arcum\'s Astrolabe', 'Inverter of Truth',
    'Underworld Breach', 'Thassa\'s Oracle', 'Teferi, Time Raveler',
    'Veil of Summer', 'Mystical Dispute', 'Shark Typhoon',

    // Iconic Spells
    'Chaos Orb', 'Shahrazad', 'Time Vault', 'Contract from Below',
    'Cleanse', 'Crusade', 'Stone-Throwing Devils', 'Invoke Prejudice',
    'Channel', 'Fireball', 'Wheel of Fortune', 'Timetwister',
    'Balance', 'Upheaval', 'Tinker', 'Gifts Ungiven', 'Ad Nauseam',
    'Tendrils of Agony', 'Dark Ritual', 'Cabal Ritual', 'High Tide',

    // Popular Recent Cards
    'Orcish Bowmasters', 'The One Ring', 'Bowmasters',
    'Elesh Norn, Mother of Machines', 'Atraxa, Grand Unifier',
    'Phyrexian Arena', 'Mondrak, Glory Dominus',
    'Skithiryx, the Blight Dragon', 'Vorinclex, Monstrous Raider',
    'Toxrill, the Corrosive', 'Grakmaw, Skyclave Ravager',
    'Chatterfang, Squirrel General', 'Jetmir, Nexus of Revels',
    'Raffine, Scheming Seer', 'Ziatora, the Incinerator',
    'Ob Nixilis, the Adversary', 'Titan of Industry',

    // Extra fill to reach 300
    'Wasteland', 'Gaea\'s Cradle', 'Serra\'s Sanctum', 'Phyrexian Arena',
    'Greater Good', 'Kindred Discovery', 'Doubling Season', 'Parallel Lives',
    'Anointed Procession', 'Purphoros, God of the Forge',
    'Consecrated Sphinx', 'Cyclonic Rift', 'Fierce Guardianship',
    'Deflecting Swat', 'Deadly Rollick', 'Flawless Maneuver',
    'Obscuring Haze', 'Mnemonic Betrayal', 'Alhammarret\'s Archive',
    'Expedition Map', 'Mana Crypt', 'Mana Vault', 'Basalt Monolith',
    'Power Artifact', 'Rings of Brighthearth', 'Voltaic Key',
    'Unwinding Clock', 'Clock of Omens', 'Illusionist\'s Bracers',
    'Strionic Resonator', 'Swarmyard', 'Forbidden Orchard',
    'Homeward Path', 'Mikokoro, Center of the Sea', 'Minamo, School at Water\'s Edge',
    'Shizo, Death\'s Storehouse', 'Okina, Temple to the Grandfathers',
];

// Deduplicate
const CARDS_TO_SEED = [...new Set(ICONIC_CARDS)].slice(0, 300);

async function fetchScryfallCard(name) {
    const url = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.object === 'error') return null;
    return data;
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function main() {
    console.log('🃏 Starting buylist seed...');

    // Get store ID
    const store = await prisma.store.findFirst();
    if (!store) {
        console.error('❌ No store found in database.');
        process.exit(1);
    }
    console.log(`✅ Store: ${store.name} (${store.id})`);

    // Clear existing featured cards
    const deleted = await prisma.buylistFeaturedCard.deleteMany({ where: { storeId: store.id } });
    console.log(`🗑  Cleared ${deleted.count} existing featured cards`);

    let inserted = 0;
    let failed = 0;

    for (let i = 0; i < CARDS_TO_SEED.length; i++) {
        const name = CARDS_TO_SEED[i];
        process.stdout.write(`[${i + 1}/${CARDS_TO_SEED.length}] ${name}... `);

        try {
            const card = await fetchScryfallCard(name);
            if (!card) {
                console.log('⚠  Not found');
                failed++;
                await sleep(100);
                continue;
            }

            const image =
                card.image_uris?.normal ||
                card.image_uris?.large ||
                card.card_faces?.[0]?.image_uris?.normal ||
                '';

            const price =
                parseFloat(card.prices?.usd) ||
                parseFloat(card.prices?.usd_foil) ||
                0;

            await prisma.buylistFeaturedCard.create({
                data: {
                    storeId: store.id,
                    name: card.name,
                    set: card.set_name,
                    setId: card.set,
                    game: 'MTG',
                    image,
                    basePrice: price > 0 ? price : null,
                },
            });

            inserted++;
            console.log(`✅ $${price.toFixed(2)}`);
        } catch (err) {
            console.log(`❌ Error: ${err.message}`);
            failed++;
        }

        // Scryfall rate limit: max 10 req/s → wait 120ms between requests
        await sleep(120);
    }

    console.log('\n─────────────────────────────────');
    console.log(`✅ Inserted: ${inserted}`);
    console.log(`⚠  Failed:  ${failed}`);
    console.log('🎉 Buylist seed complete!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
