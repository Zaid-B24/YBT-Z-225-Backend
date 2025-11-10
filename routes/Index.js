const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    message: "YBT API is up and running!",
  });
});
//Only need to add zod validation to update fields, and get fields, in cars and bikes
const userRoutes = require("./userRoutes");
const authRoutes = require("./authRoutes");
const carRoutes = require("./carRoutes");
const bikeRoutes = require("./bikeRoutes");
const vehicleRoute = require("./vehicleRoute");
const eventRoute = require("./Events/eventRoute");
const TicketBooking = require("./Events/TicketBooking");
const webhooks = require("./webhooks");
const CategoryRoute = require("./Events/CategoryRoute");
const dealerRoute = require("./dealerRoute");
const designerRoute = require("./designerRoute");
const workshopRoute = require("./workShopRoute");

router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/cars", carRoutes);
router.use("/bikes", bikeRoutes);
router.use("/vehicles", vehicleRoute);
router.use("/events", eventRoute);
router.use("/ticketbooking", TicketBooking);
router.use("/webhooks", webhooks);
router.use("/eventcategory", CategoryRoute);
router.use("/dealer", dealerRoute);
router.use("/designer", designerRoute);
router.use("/workshop", workshopRoute);

module.exports = router;
