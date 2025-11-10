const express = require("express");
const router = express.Router();
const BookingController = require("../../controllers/Events/BookingController");
const { protect } = require("../../middleware/authMiddleware");
const { initiateBookingSchema } = require("../../validators/BookingValidator");
const handleIdempotency = require("../../middleware/idempotencyMiddleware");
const validate = require("../../validators/Validator");

router.get("/bookings", protect, BookingController.getBookings);

router.post(
  "/",
  protect,
  validate(initiateBookingSchema),
  handleIdempotency,
  BookingController.initiateBooking
);

router.post("/verify", protect, BookingController.verifyBooking);
module.exports = router;
