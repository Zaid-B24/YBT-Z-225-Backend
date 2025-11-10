// prisma/seed.js

const { PrismaClient } = require("@prisma/client");
const { faker } = require("@faker-js/faker");
const slugify = require("slugify");

const prisma = new PrismaClient();

// Configuration for how many NEW records to create each time the script runs
const TOTAL_EVENTS_TO_ADD = 250;

// Helper function to get a random item from an array
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  console.log("🌱 Starting the additive seeding process...");

  // 1. Find or create the specific Admin User (ID: 5)
  console.log("👤 Ensuring admin user (ID: 5) exists...");
  const adminUser = await prisma.user.upsert({
    where: { id: 5 },
    update: {}, // Nothing to update if found
    create: {
      id: 5,
      email: "admin@gmail.com",
      name: "Admin",
      role: "ADMIN",
      password: "a-secure-password-hash", // Placeholder
    },
  });
  console.log(`✅ Using admin user with ID: ${adminUser.id}`);

  // 2. Ensure Event Categories exist, create them if necessary
  console.log("🏷️ Checking for event categories...");
  let categories = await prisma.eventCategory.findMany();

  if (categories.length === 0) {
    console.log("No categories found, creating default ones...");
    const categoryNames = [
      "Music Festivals",
      "Tech Conferences",
      "Food & Drink",
      "Art & Culture",
      "Sports & Fitness",
      "Business Workshops",
      "Charity & Causes",
      "Automotive Shows",
    ];
    categories = await Promise.all(
      categoryNames.map((name) =>
        prisma.eventCategory.create({
          data: { name, slug: slugify(name, { lower: true, strict: true }) },
        })
      )
    );
    console.log(`✅ Created ${categories.length} new categories.`);
  } else {
    console.log(`✅ Found ${categories.length} existing categories.`);
  }

  // 3. Create NEW Events and add them to the database
  console.log(`🚀 Adding ${TOTAL_EVENTS_TO_ADD} new events...`);
  for (let i = 0; i < TOTAL_EVENTS_TO_ADD; i++) {
    const title = faker.company.catchPhrase() + " " + faker.word.noun();
    const slug =
      slugify(title, { lower: true, strict: true }) +
      "-" +
      faker.string.alphanumeric(6);
    const startDate = faker.date.between({
      from: "2025-10-15T00:00:00.000Z",
      to: "2026-12-31T00:00:00.000Z",
    });
    const endDate = faker.date.soon({ days: 3, refDate: startDate });

    const ticketTypesToCreate = [];
    let totalQuantity = 0;
    const numTicketTypes = faker.number.int({ min: 1, max: 3 });

    for (let j = 0; j < numTicketTypes; j++) {
      const quantity = faker.number.int({ min: 50, max: 400 });
      totalQuantity += quantity;
      ticketTypesToCreate.push({
        name: ["General", "VIP", "Early Bird"][j] || `Tier ${j + 1}`,
        price: parseFloat(faker.commerce.price({ min: 200, max: 5000 })),
        quantity: quantity,
      });
    }

    const imageUrls = Array.from(
      { length: faker.number.int({ min: 2, max: 5 }) },
      () => faker.image.urlLoremFlickr({ category: "concert" })
    );

    const categoriesToConnect = [getRandomItem(categories)];
    if (Math.random() > 0.6 && categories.length > 1) {
      const secondCategory = getRandomItem(
        categories.filter((c) => c.id !== categoriesToConnect[0].id)
      );
      if (secondCategory) categoriesToConnect.push(secondCategory);
    }

    await prisma.event.create({
      data: {
        title,
        slug,
        description: faker.lorem.paragraphs(2),
        location: `${faker.location.city()}, Maharashtra`,
        startDate,
        endDate,
        type: getRandomItem(["PUBLIC", "PRIVATE"]),
        status: "PUBLISHED",
        isFeatured: faker.datatype.boolean(0.2), // 20% chance
        maxAttendees: totalQuantity,
        imageUrls,
        primaryImage: imageUrls[0],
        facilities: Array.from(
          { length: faker.number.int({ min: 3, max: 5 }) },
          () => faker.commerce.productAdjective()
        ),
        youshouldKnow: Array.from(
          { length: faker.number.int({ min: 2, max: 3 }) },
          () => faker.lorem.sentence()
        ),
        creatorId: adminUser.id, // Direct connection using the ID
        categories: {
          connect: categoriesToConnect.map((cat) => ({ id: cat.id })),
        },
        ticketTypes: {
          create: ticketTypesToCreate,
        },
      },
    });

    if ((i + 1) % 50 === 0) {
      console.log(`... added ${i + 1} / ${TOTAL_EVENTS_TO_ADD} new events`);
    }
  }

  console.log("🎉 Seeding finished successfully! More events were added.");
}

main()
  .catch((e) => {
    console.error("❌ An error occurred during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("🔌 Database connection closed.");
  });
