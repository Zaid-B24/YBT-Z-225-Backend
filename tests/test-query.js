const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: ["query"],
});

async function main() {
  console.log("--- Starting simple test script ---");
  try {
    const events = await prisma.event.findMany({
      where: {},
      cursor: {
        // Use a real cursor ID from your database
        startDate_id: {
          startDate: new Date("2026-11-28T07:54:55.961Z"), // Use the actual startDate of the cursor ID
          id: 176, // Use the actual ID of the cursor
        },
      },
      take: 11,
      skip: 1,
      orderBy: [
        // FIX: This must be an array of objects for multi-column sorting
        { startDate: "desc" },
        { id: "desc" },
      ],
    });
    console.log(`--- Found ${events.length} events ---`);
  } catch (e) {
    console.error("--- Test script failed ---");
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
