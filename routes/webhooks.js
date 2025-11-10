const express = require("express");
const router = express.Router();
const BookingController = require("../controllers/Events/BookingController");

router.post("/razorpay", BookingController.handlePaymentWebhook);

module.exports = router;
