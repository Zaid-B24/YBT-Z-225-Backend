require("dotenv").config();
const http = require("http");
const app = require("./app");
const prisma = require("./utils/prisma");
const redis = require("./utils/redis");
const cron = require("node-cron");

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

const connectAndStart = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    await redis.ping();
    console.log("✅ Redis connected successfully");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to a required service:", error);
    process.exit(1);
  }
};

cron.schedule("*/4 * * * *", async () => {
  try {
    console.log("🕒 Pinging database to keep it alive...");
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database pinged successfully.");
  } catch (error) {
    console.error("❌ Error pinging the database:", error);
  }
});

const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  try {
    server.close(async () => {
      console.log("HTTP server closed.");
      await prisma.$disconnect();
      console.log("🔌 Database disconnected.");
      await redis.quit();
      console.log("🔌 Redis disconnected.");

      process.exit(0);
    });
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

connectAndStart();
