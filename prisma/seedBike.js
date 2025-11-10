const { PrismaClient } = require("@prisma/client");
const { faker } = require("@faker-js/faker");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting bike seeding...");

  await prisma.bike.deleteMany({});
  console.log("🗑️  Cleared previous bike data.");

  const numberOfBikes = 2000; // adjust as you like

  for (let i = 0; i < numberOfBikes; i++) {
    const brand = faker.vehicle.manufacturer();
    const model = faker.vehicle.model();
    const title = `${brand} ${model}`;

    // Generate bike images first to use one as a thumbnail
    const bikeImages = [
      faker.image.urlLoremFlickr({
        category: "motorcycle",
        width: 1280,
        height: 720,
      }),
      faker.image.urlLoremFlickr({
        category: "motorcycle",
        width: 1280,
        height: 720,
      }),
      faker.image.urlLoremFlickr({
        category: "motorcycle",
        width: 1280,
        height: 720,
      }),
      faker.image.urlLoremFlickr({
        category: "motorcycle",
        width: 1280,
        height: 720,
      }),
    ];

    const bikeData = {
      title,
      description: faker.lorem.paragraph(),

      // Pricing
      sellingPrice: parseFloat(
        faker.commerce.price({ min: 30000, max: 250000 })
      ),
      cutOffPrice: parseFloat(
        faker.commerce.price({ min: 25000, max: 200000 })
      ),
      ybtPrice: parseFloat(faker.commerce.price({ min: 28000, max: 240000 })),

      // Registration and ownership
      registrationYear: faker.date.past({ years: 10 }).getFullYear(),
      registrationNumber: `${faker.location.state({
        abbreviated: true,
      })}${faker.string.numeric(2)}${faker.string
        .alpha(2)
        .toUpperCase()}${faker.string.numeric(4)}`,
      kmsDriven: faker.number.int({ min: 1000, max: 80000 }),
      ownerCount: faker.number.int({ min: 1, max: 3 }),
      insurance: faker.helpers.arrayElement([
        "Comprehensive",
        "Third Party",
        "None",
      ]),

      // Other specs
      listedBy: "Dealer",
      badges: faker.helpers.arrayElements(
        ["POPULAR", "LOW_KMS", "WELL_MAINTAINED"],
        {
          min: 1,
          max: 2,
        }
      ),
      vipNumber: faker.datatype.boolean(),

      // Bike details
      brand,
      bikeUSP: faker.lorem.sentence(),
      fuelType: faker.helpers.arrayElement(["PETROL", "ELECTRIC"]),

      // Media
      thumbnail: bikeImages[0],
      bikeImages: bikeImages,
    };

    await prisma.bike.create({ data: bikeData });
  }

  console.log(`✅ Successfully created ${numberOfBikes} bike records.`);
}

main()
  .catch((e) => {
    console.error("💥 FAILED TO SEED DATABASE:", e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("👋 Seeding finished. Disconnecting Prisma Client.");
    await prisma.$disconnect();
  });
