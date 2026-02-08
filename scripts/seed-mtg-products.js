const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Data to Seed
const CARDS = [
    {
        name: "Black Lotus",
        oracleId: "56d4943f-56bb-4479-86f3-333e83921501", // Fake but consistent
        oracleText: "{T}, Sacrifice Black Lotus: Add three mana of any one color.",
        legalities: { commander: "banned", vintage: "restricted", legacy: "banned" },
        printings: [
            {
                set: "Alpha",
                rarity: "rare",
                collectorNumber: "232",
                image: "https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg",
                variants: [
                    { condition: "NM", price: 45000.00, quantity: 1, isFoil: false },
                    { condition: "HP", price: 12000.00, quantity: 1, isFoil: false }
                ]
            },
            {
                set: "Beta",
                rarity: "rare",
                collectorNumber: "233",
                image: "https://cards.scryfall.io/large/front/9/9/99a9103c-e5df-4206-9293-843d4fba7ae8.jpg",
                variants: [
                    { condition: "MP", price: 18000.00, quantity: 1, isFoil: false }
                ]
            }
        ]
    },
    {
        name: "Sol Ring",
        oracleId: "12345678-1234-1234-1234-123456789012",
        oracleText: "{T}: Add {C}{C}.",
        legalities: { commander: "legal", vintage: "restricted", legacy: "banned" },
        printings: [
            {
                set: "Commander Legends",
                rarity: "uncommon",
                collectorNumber: "300",
                image: "https://cards.scryfall.io/large/front/0/5/050730b2-72c1-4bb2-bd24-345391d14141.jpg",
                variants: [
                    { condition: "NM", price: 1.50, quantity: 20, isFoil: false },
                    { condition: "NM", price: 4.50, quantity: 5, isFoil: true }
                ]
            },
            {
                set: "Kaladesh Masterpiece",
                rarity: "mythic",
                collectorNumber: "52",
                image: "https://cards.scryfall.io/large/front/e/0/e0d8f07b-89d3-455b-9d41-37d45f95f4db.jpg",
                variants: [
                    { condition: "NM", price: 350.00, quantity: 1, isFoil: true }
                ]
            }
        ]
    },
    {
        name: "The One Ring",
        oracleId: "98765432-1234-1234-1234-123456789012",
        oracleText: "Indestructible. When The One Ring enters the battlefield, if you cast it, you gain protection from everything until your next turn.\nAt the beginning of your upkeep, you lose 1 life for each burden counter on The One Ring.\n{T}: Put a burden counter on The One Ring, then draw a card for each burden counter on it.",
        legalities: { commander: "legal", modern: "legal", legacy: "legal" },
        printings: [
            {
                set: "Lord of the Rings: Tales of Middle-earth",
                rarity: "mythic",
                collectorNumber: "001",
                image: "https://cards.scryfall.io/large/front/d/5/d5806e68-1054-458e-866d-5fbd809520ca.jpg",
                variants: [
                    { condition: "NM", price: 65.00, quantity: 4, isFoil: false },
                    { condition: "NM", price: 120.00, quantity: 2, isFoil: true }
                ]
            }
        ]
    }
];

async function main() {
    console.log('🌱 Seeding MTG Products...');

    // Get Store
    const store = await prisma.store.findFirst();
    if (!store) throw new Error("Store not found! Run seed-one.js first.");

    for (const cardData of CARDS) {
        console.log(`Processing ${cardData.name}...`);

        // 1. Create/Update Card (Oracle)
        const card = await prisma.card.upsert({
            where: { oracleId: cardData.oracleId },
            update: {},
            create: {
                oracleId: cardData.oracleId,
                name: cardData.name,
                oracleText: cardData.oracleText,
                legalities: cardData.legalities
            }
        });

        // 2. Create Printings (Products)
        for (const printing of cardData.printings) {
            // Check if product exists to avoid duplicates
            // We use a hacky check by name + set + collector number
            const existing = await prisma.product.findFirst({
                where: {
                    name: cardData.name,
                    set: printing.set,
                    collectorNumber: printing.collectorNumber
                }
            });

            if (existing) {
                console.log(`  Skipping existing printing: ${printing.set}`);
                continue;
            }

            const product = await prisma.product.create({
                data: {
                    storeId: store.id,
                    name: cardData.name,
                    set: printing.set,
                    rarity: printing.rarity,
                    collectorNumber: printing.collectorNumber,
                    images: [printing.image],
                    cardId: card.id,
                    game: 'MTG',
                    price: printing.variants[0].price, // Root price
                    variants: {
                        create: printing.variants.map(v => ({
                            condition: v.condition,
                            price: v.price,
                            quantity: v.quantity, // This is technically on ProductVariant in schema?
                            // Wait, schema has InventoryItem separate?
                            // Let's check schema.prisma
                            isFoil: v.isFoil,
                            language: 'English',
                            inventory: {
                                create: {
                                    quantity: v.quantity,
                                    location: 'Seed'
                                }
                            }
                        }))
                    }
                }
            });
            console.log(`  Created ${printing.set} Printing (ID: ${product.id})`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
