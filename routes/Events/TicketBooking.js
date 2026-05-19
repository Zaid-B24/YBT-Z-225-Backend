const express = require("express");
const router = express.Router();
const BookingController = require("../../controllers/Events/BookingController");
const { protect } = require("../../middleware/authMiddleware");
const { initiateBookingSchema } = require("../../validators/BookingValidator");
const handleIdempotency = require("../../middleware/idempotencyMiddleware");
const validate = require("../../validators/Validator");
const razorpay = require("../../config/razorpay");
const prisma = require("../../utils/prisma");

router.get("/bookings", protect, BookingController.getBookings);

router.post(
  "/",
  protect,
  validate(initiateBookingSchema),
  handleIdempotency,
  BookingController.initiateBooking
);

router.post("/verify", protect, BookingController.verifyBooking);

router.post("/refund", protect, async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
    });

    if (!order || order.status !== "COMPLETED" || !order.razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: "Order not eligible for refund.",
      });
    }

    const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
      amount: Math.round(order.totalAmount * 100),
    });

    res.status(200).json({
      success: true,
      message: "Refund initiated.",
      data: { refundId: refund.id },
    });
  } catch (error) {
    console.error("Refund initiation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to initiate refund.",
    });
  }
});

module.exports = router;
