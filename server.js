require("dotenv").config();
const http = require("http");
const app = require("./app");
const prisma = require("./utils/prisma");
const redis = require("./utils/redis");
const cron = require("node-cron");
const { processStuckOrders } = require("./services/Cron/cleanupService");
const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

const connectAndStart = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    await redis.ping();
    console.log("Redis connected successfully");

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to a required service:", error);
    process.exit(1);
  }
};

cron.schedule("*/15 * * * *", () => {
  console.log("Cron Job Triggered: Cleaning stuck orders...");
  processStuckOrders();
});

const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  try {
    server.close(async () => {
      console.log("HTTP server closed.");
      await prisma.$disconnect();
      console.log("Database disconnected.");
      await redis.quit();
      console.log("Redis disconnected.");

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
