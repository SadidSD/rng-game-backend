
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const store = await prisma.store.findFirst();
        if (!store) throw new Error("Store not found");

        console.log(`Using Store ID: ${store.id}`);

        // Define last 7 days range
        const days = 7;
        const now = new Date();

        console.log("Creating past orders for graph visualization...");

        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(now.getDate() - i);

            // Random number of orders per day (0-3)
            const orderCount = Math.floor(Math.random() * 4);

            for (let j = 0; j < orderCount; j++) {
                // Random time adjustment
                const orderDate = new Date(date);
                orderDate.setHours(Math.floor(Math.random() * 24));
                orderDate.setMinutes(Math.floor(Math.random() * 60));

                const total = (Math.random() * 100 + 10).toFixed(2);

                try {
                    await prisma.order.create({
                        data: {
                            storeId: store.id,
                            status: 'COMPLETED',
                            total: total, // Pass as string for Decimal
                            createdAt: orderDate,
                            customer: {
                                connectOrCreate: {
                                    where: {
                                        storeId_email: {
                                            storeId: store.id,
                                            email: `demo-${i}-${j}@example.com`
                                        }
                                    },
                                    create: {
                                        storeId: store.id,
                                        email: `demo-${i}-${j}@example.com`,
                                        firstName: 'Demo',
                                        lastName: 'User'
                                    }
                                }
                            },
                            items: {
                                create: [{
                                    productName: 'Seed Product',
                                    quantity: 1,
                                    price: total // Pass as string
                                }]
                            }
                        }
                    });
                    console.log(`Created order for ${orderDate.toDateString()} - $${total}`);
                } catch (err) {
                    console.error("Failed to create order:", err.message);
                }
            }
        }
        console.log("Done seeding past orders.");

    } catch (e) {
        console.error("Script failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
