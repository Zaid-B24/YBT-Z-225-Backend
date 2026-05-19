const BookingService = require("../../services/Events/BookingService");

exports.initiateBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const { eventId, items } = req.body;
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
    const bodyToVerify = req.rawBody || req.body;
    const eventType = req.body?.event;

    if (!eventType) {
      return res
        .status(400)
        .json({ success: false, message: "Missing event type." });
    }

    if (eventType === "payment.captured") {
      await BookingService.confirmBooking(bodyToVerify, signature, eventType);
    } else if (eventType === "refund.processed") {
      await BookingService.processRefundWebhook(
        bodyToVerify,
        signature,
        eventType
      );
    } else {
      console.log(`Unhandled Razorpay event: ${eventType}`);
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    if (error.message === "InvalidWebhookSignature") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature." });
    }
    res
      .status(400)
      .json({ success: false, message: "Webhook processing failed." });
  }
};

exports.verifyBooking = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing payment details." });
    }

    const completedOrder = await BookingService.verifyPayment(
      userId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

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
