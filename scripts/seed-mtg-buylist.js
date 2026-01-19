const path = require('path');
// unexpected quirks in mono-repos: try to load from api/node_modules if root fails
let PrismaClient, axios, https;

try {
    // Try standard resolve first (if root has deps)
    PrismaClient = require('@prisma/client').PrismaClient;
    axios = require('axios');
} catch (e) {
    // Fallback to api/node_modules
    console.log('⚠️ Falling back to api/node_modules...');
    PrismaClient = require('../api/node_modules/@prisma/client').PrismaClient;
    axios = require('../api/node_modules/axios');
    if (axios.default) axios = axios.default;
}
https = require('https');

// Load Env from api/.env
try {
    require('dotenv').config({ path: path.join(__dirname, '../api/.env') });
} catch (e) {
    require('../api/node_modules/dotenv').config({ path: path.join(__dirname, '../api/.env') });
}

const prisma = new PrismaClient();

// Configuration
const STORE_ID = process.env.SINGLE_TENANT_STORE_ID || 'd02dbcba-81b5-4f9d-831c-54fe9a803081'; // Default ID
const BATCH_DELAY_MS = 100; // Scryfall asks for 50-100ms

const rawList = `
Sol Ring
Arcane Signet
Fellwar Stone
Mind Stone
Thought Vessel
Everflowing Chalice
Wayfarer’s Bauble
Commander’s Sphere
Chromatic Lantern
Talisman of Dominance
Talisman of Conviction
Talisman of Progress
Talisman of Creativity
Talisman of Resilience
Talisman of Impulse
Talisman of Unity
Talisman of Hierarchy
Talisman of Indulgence
Talisman of Curiosity
Talisman of Innovation
Gilded Lotus
Basalt Monolith
Grim Monolith
Jeweled Lotus
Thran Dynamo
Skyclave Relic
Coalition Relic
Mana Vault
Mana Crypt
Arcane Encyclopedia
Hedron Archive
Prismatic Lens
Coldsteel Heart
Thought Vessel
Honor-Worn Shaku
Astral Cornucopia
Burnished Hart
Solemn Simulacrum
Nyx Lotus
Command Tower
Exotic Orchard
Reliquary Tower
Swiftfoot Boots
Lightning Greaves
Skullclamp
Sensei’s Divining Top
The One Ring
Smothering Tithe
Rhystic Study
Mystic Remora
Esper Sentinel
Dockside Extortionist
Cyclonic Rift
Teferi’s Protection
Heroic Intervention
Beast Within
Chaos Warp
Swords to Plowshares
Path to Exile
Anguished Unmaking
Generous Gift
Utter End
Terminate
Putrefy
Mortify
Vindicate
Farewell
Damn
Blasphemous Act
Toxic Deluge
Austere Command
Supreme Verdict
Merciless Eviction
Demonic Tutor
Vampiric Tutor
Enlightened Tutor
Worldly Tutor
Mystical Tutor
Diabolic Intent
Imperial Seal
Finale of Devastation
Green Sun’s Zenith
Chord of Calling
Craterhoof Behemoth
Avenger of Zendikar
Consecrated Sphinx
Sheoldred, the Apocalypse
Kozilek, Butcher of Truth
Ulamog, the Infinite Gyre
Ulamog, the Ceaseless Hunger
Emrakul, the Promised End
Atraxa, Praetors’ Voice
Edgar Markov
The Ur-Dragon
Korvold, Fae-Cursed King
Prosper, Tome-Bound
Muldrotha, the Gravetide
Yuriko, the Tiger’s Shadow
Krenko, Mob Boss
Miirym, Sentinel Wyrm
Najeela, the Blade-Blossom
Isshin, Two Heavens as One
Chatterfang, Squirrel General
Winota, Joiner of Forces
Jodah, the Unifier
Kenrith, the Returned King
Tivit, Seller of Secrets
Breya, Etherium Shaper
Atraxa, Grand Unifier
Sisay, Weatherlight Captain
Kaalia of the Vast
Lathril, Blade of the Elves
Aesi, Tyrant of Gyre Strait
Omnath, Locus of Creation
Omnath, Locus of Rage
Omnath, Locus of Mana
Marchesa, the Black Rose
Nekusar, the Mindrazer
Animar, Soul of Elements
Zur the Enchanter
Yawgmoth, Thran Physician
Magda, Brazen Outlaw
Godo, Bandit Warlord
Tymna the Weaver
Thrasios, Triton Hero
Kinnan, Bonder Prodigy
Urza, Lord High Artificer
Yarok, the Desecrated
Jetmir, Nexus of Revels
Satoru Umezawa
Talrand, Sky Summoner
Wilhelt, the Rotcleaver
Edric, Spymaster of Trest
Xenagos, God of Revels
Raffine, Scheming Seer
Alela, Artful Provocateur
Veyran, Voice of Duality
Obeka, Brute Chronologist
Henzie “Toolbox” Torre
Anje Falkenrath
Feather, the Redeemed
Hinata, Dawn-Crowned
Shorikai, Genesis Engine
Toxrill, the Corrosive
Zhulodok, Void Gorger
Sliver Overlord
Sliver Queen
Atraxa’s Fall
Lightning Bolt
Fatal Push
Thoughtseize
Inquisition of Kozilek
Drown in the Loch
Counterspell
Force of Will
Force of Negation
Mana Drain
Flusterstorm
Spell Pierce
Negate
Abrupt Decay
Assassin’s Trophy
Kolaghan’s Command
Lightning Helix
Wear // Tear
Prismatic Ending
March of Otherworldly Light
Leyline Binding
Terminate
Dismember
Path to Exile
Swords to Plowshares
Unholy Heat
Boseiju, Who Endures
Otawara, Soaring City
March of Swirling Mist
Fury
Solitude
Endurance
Subtlety
Grief
Ephemerate
Veil of Summer
Silence
Deflecting Palm
Orim’s Chant
Teferi, Time Raveler
Narset, Parter of Veils
Liliana of the Veil
Karn, the Great Creator
Ugin, the Spirit Dragon
Ragavan, Nimble Pilferer
Wrenn and Six
Ledger Shredder
Murktide Regent
Snapcaster Mage
Tarmogoyf
Death’s Shadow
Stoneforge Mystic
Urza’s Saga
Fable of the Mirror-Breaker
The One Ring
Yawgmoth, Thran Physician
Sheoldred, the Apocalypse
Seasoned Pyromancer
Expressive Iteration
Teferi, Hero of Dominaria
Jace, the Mind Sculptor
Karn Liberated
Collected Company
Aether Vial
Primeval Titan
Dryad of the Ilysian Grove
Valakut, the Molten Pinnacle
Amulet of Vigor
Crashing Footfalls
Living End
Violent Outburst
Shardless Agent
Goryo’s Vengeance
Griselbrand
Indomitable Creativity
Archon of Cruelty
Omnath, Locus of Creation
Blood Moon
Chalice of the Void
Ensnaring Bridge
Polluted Delta
Flooded Strand
Bloodstained Mire
Wooded Foothills
Windswept Heath
Misty Rainforest
Scalding Tarn
Marsh Flats
Arid Mesa
Verdant Catacombs
Hallowed Fountain
Watery Grave
Blood Crypt
Stomping Ground
Temple Garden
Breeding Pool
Steam Vents
Godless Shrine
Sacred Foundry
Overgrown Tomb
Cavern of Souls
Boseiju, Who Shelters All
Ancient Tomb
City of Traitors
Urborg, Tomb of Yawgmoth
Cabal Coffers
Gaea’s Cradle
Nykthos, Shrine to Nyx
Field of the Dead
Strip Mine
Wasteland
Ghost Quarter
Blast Zone
Reflecting Pool
Mana Confluence
Forbidden Orchard
Command Beacon
Reliquary Tower
Fabled Passage
Prismatic Vista
Dark Depths
Thespian’s Stage
Lotus Field
Hall of Heliod’s Generosity
Inventors’ Fair
Buried Ruin
Academy Ruins
Bojuka Bog
Deserted Temple
Cultivate
Kodama’s Reach
Rampant Growth
Nature’s Lore
Three Visits
Farseek
Brainstorm
Ponder
Preordain
Opt
Faithless Looting
Read the Bones
Sign in Blood
Night’s Whisper
Village Rites
Deadly Dispute
Go for the Throat
Infernal Grasp
Heartless Act
Doom Blade
Negate
Cancel
Arcane Denial
Counterspell
Terminate
Putrefy
Mortify
Beast Within
Generous Gift
Chaos Warp
Return to Nature
Krosan Grip
Nature’s Claim
Blasphemous Act
Wrath of God
Day of Judgment
Damnation
Supreme Verdict
Solemn Simulacrum
Burnished Hart
Skullclamp
Swiftfoot Boots
Lightning Greaves
Command Tower
Evolving Wilds
Terramorphic Expanse
Path of Ancestry
`;

const httpsAgent = new https.Agent({ keepAlive: true });

async function fetchScryfall(name) {
    try {
        const url = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`;
        const res = await axios.get(url, { httpsAgent, timeout: 5000 });
        const card = res.data;
        return {
            name: card.name,
            set: card.set_name,
            setId: card.set,
            image: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || '',
            basePrice: card.prices?.usd || 0,
            game: 'MTG'
        };
    } catch (e) {
        if (e.response && e.response.status === 404) {
            console.log(`❌ [404] Not Found: ${name}`);
        } else {
            console.error(`❌ Error fetching ${name}: ${e.message}`);
        }
        return null;
    }
}

async function main() {
    console.log('🌱 Starting MTG Buylist Seed...');

    // Parse list
    const names = rawList
        .split('\n')
        .map(n => n.trim())
        .filter(n => n.length > 2 && !n.includes('SECTION') && !n.includes('Final Counts') && !n.includes('Total') && !n.includes('Signets (all 10)') && !n.includes('Talismans (all 10)'));

    // De-duplicate
    const uniqueNames = [...new Set(names)];
    console.log(`📋 Found ${uniqueNames.length} unique cards to process.`);

    const storeId = STORE_ID;

    // Ensure store exists
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
        console.log(`⚠️ Store ${storeId} not found, creating default...`);
        await prisma.store.create({
            data: { id: storeId, name: 'Default Store', apiKey: 'seed-key' }
        });
    }

    let successes = 0;

    for (const name of uniqueNames) {
        // Skip if already exists? (Optional, but good for re-running)
        const exists = await prisma.buylistFeaturedCard.findFirst({
            where: { storeId, name: { equals: name, mode: 'insensitive' } }
        });

        if (exists) {
            console.log(`⏩ Skipping (Exists): ${name}`);
            continue;
        }

        const data = await fetchScryfall(name);
        if (data && data.image) {
            await prisma.buylistFeaturedCard.create({
                data: {
                    storeId,
                    name: data.name,
                    set: data.set,
                    setId: data.setId,
                    game: 'MTG',
                    image: data.image,
                    basePrice: data.basePrice ? Number(data.basePrice) : 0
                }
            });
            console.log(`✅ Added: ${data.name}`);
            successes++;
        }

        // Rate limit
        await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }

    console.log(`\n🎉 Seeding Complete! Added ${successes} new cards.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
