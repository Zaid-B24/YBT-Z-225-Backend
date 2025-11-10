// In your EventBookingController.js
const BookingService = require("../../services/Events/BookingService"); // or your path

exports.initiateBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const { eventId, items } = req.body; // Data is already validated by Zod
    console.log("this is req.body", req.body);
    const orderDetails = await BookingService.initiateBooking(
      userId,
      eventId,
      items
    );

    res.status(201).json({
      success: true,
      message: "Booking initiated. Please proceed to payment.",
      data: orderDetails,
    });
  } catch (error) {
    console.error("Initiate booking error:", error);
    const statusCode = error.isOperational ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

exports.handlePaymentWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];

    // Call the service to handle all logic
    await BookingService.confirmBooking(req.body, signature);

    // Respond to Razorpay to acknowledge receipt of the webhook
    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    if (error.message === "InvalidWebhookSignature") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature." });
    }
    // Don't send a 500 error to Razorpay, as they may retry.
    // A 400 Bad Request is often better if the payload is malformed.
    res
      .status(400)
      .json({ success: false, message: "Webhook processing failed." });
  }
};

exports.verifyBooking = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const userId = req.user.id; // From 'protect' middleware

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing payment details." });
    }

    // Call the new service function
    const completedOrder = await BookingService.verifyPayment(
      userId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!completedOrder) {
      // This means the booking was already processed (e.g., by the webhook)
      // This is a "success" case, but we need the booking ID.
      const order = await BookingService.findBookingByRazorpayId(
        razorpay_order_id
      );

      if (order && order.userId === userId) {
        return res.status(200).json({
          success: true,
          message: "Booking already verified.",
          data: { bookingId: order.id },
        });
      }
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }

    // The payment was verified by this call just now
    res.status(200).json({
      success: true,
      message: "Booking confirmed successfully!",
      data: { bookingId: completedOrder.id },
    });
  } catch (error) {
    console.error("Verify booking error:", error);
    const statusCode = error.isOperational ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

exports.getBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingsData = await BookingService.getBookings(userId);
    res.status(200).json({
      success: true,
      data: bookingsData,
    });
  } catch (error) {
    console.error(`Failed to get bookings for user ${req.user.id}:`, error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch bookings." });
  }
};
