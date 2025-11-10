const prisma = require("../../utils/prisma");
const razorpay = require("../../config/razorpay"); // Your Razorpay instance
const crypto = require("crypto");
const redisService = require("../redisService");

const _finalizeBooking = async (tx, razorpayOrderId, razorpayPaymentId) => {
  // Find the PENDING order using the Razorpay Order ID
  const order = await tx.order.findFirst({
    where: { razorpayOrderId: razorpayOrderId, status: "PENDING" },
    include: { items: { include: { ticketType: true } } },
  });

  if (!order) {
    // Order not found or already processed. This is not an error.
    console.log(
      `Order ${razorpayOrderId} not found or already processed. Acknowledging.`
    );
    return null;
  }

  // Update the order status to COMPLETED
  const completedOrder = await tx.order.update({
    where: { id: order.id },
    data: {
      status: "COMPLETED",
      razorpayPaymentId: razorpayPaymentId,
    },
  });

  // Create EventRegistration records for each ticket
  const registrationPromises = order.items.flatMap((item) =>
    Array.from({ length: item.quantity }, () =>
      tx.eventRegistration.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          eventId: item.ticketType.eventId,
          ticketTypeId: item.ticketTypeId,
        },
      })
    )
  );
  await Promise.all(registrationPromises);

  // IMPORTANT: Clear the ticket locks from Redis
  const lockPromises = order.items.map((item) =>
    redisService.releaseLock(item.ticketTypeId, item.quantity)
  );
  await Promise.all(lockPromises);

  return completedOrder;
};

exports.initiateBooking = async (userId, eventId, items) => {
  for (const item of items) {
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: item.ticketTypeId },
    });
    if (!ticketType) {
      throw new Error(`Ticket type ID ${item.ticketTypeId} not found.`);
    }
    const lockedCount = await redisService.getLockedCount(item.ticketTypeId);
    const available = ticketType.quantity - lockedCount;
    if (available < item.quantity) {
      const err = new Error(
        `Not enough tickets for '${ticketType.name}'. Only ${available} available.`
      );
      err.isOperational = true;
      throw err;
    }
  }

  try {
    for (const item of items) {
      await redisService.createLock(item.ticketTypeId, item.quantity);
    }
  } catch (error) {
    console.error("Failed to acquire Redis lock:", error);
    throw new Error("Could not reserve tickets. Please try again.");
  }

  let pendingOrder;
  try {
    pendingOrder = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData = [];
      for (const item of items) {
        const ticketType = await tx.ticketType.findUnique({
          where: { id: item.ticketTypeId },
        });

        if (ticketType.quantity < item.quantity) {
          throw new Error(
            `Someone just booked the last tickets for '${ticketType.name}'.`
          );
        }

        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: { quantity: { decrement: item.quantity } },
        });

        totalAmount += ticketType.price * item.quantity;
        orderItemsData.push({
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
          priceAtPurchase: ticketType.price,
        });
      }

      return tx.order.create({
        data: {
          userId,
          totalAmount,
          status: "PENDING",
          items: { create: orderItemsData },
        },
        include: { items: true },
      });
    });
  } catch (error) {
    console.error("Database transaction failed, releasing Redis locks.", error);
    for (const item of items) {
      await redisService.releaseLock(item.ticketTypeId, item.quantity);
    }
    const finalError = new Error(
      error.isOperational
        ? error.message
        : "Failed to confirm ticket availability."
    );
    finalError.isOperational = error.isOperational || true;
    throw finalError;
  }

  const razorpayOptions = {
    amount: pendingOrder.totalAmount * 100, // Amount in the smallest currency unit (paise)
    currency: "INR",
    receipt: `receipt_order_${pendingOrder.id}`, // A unique receipt ID
    notes: {
      bookingId: pendingOrder.id,
      userId: userId,
      eventId: eventId,
    },
  };
  try {
    const razorpayOrder = await razorpay.orders.create(razorpayOptions);
    await prisma.order.update({
      where: { id: pendingOrder.id },
      data: {
        razorpayOrderId: razorpayOrder.id,
      },
    });
    pendingOrder.razorpayOrderId = razorpayOrder.id;

    return { databaseOrder: pendingOrder, razorpayOrder };
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    await prisma.$transaction(async (tx) => {
      for (const item of pendingOrder.items) {
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: { quantity: { increment: item.quantity } },
        });
        await redisService.releaseLock(item.ticketTypeId, item.quantity);
      }
    });
    throw new Error("Failed to create payment order. Please try again.");
  }
};

exports.confirmBooking = async (webhookBody, signature) => {
  // 1. Verify the webhook signature
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET) // Use webhook secret
    .update(JSON.stringify(webhookBody))
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new Error("InvalidWebhookSignature");
  }

  // 2. Extract data from the webhook payload
  const razorpayOrderId = webhookBody.payload.payment.entity.order_id;
  const razorpayPaymentId = webhookBody.payload.payment.entity.id;

  if (!razorpayOrderId) {
    throw new Error("OrderIdMissingFromPayload");
  }

  // 3. Call the helper function inside a transaction
  return prisma.$transaction(async (tx) => {
    return await _finalizeBooking(tx, razorpayOrderId, razorpayPaymentId);
  });
};

exports.verifyPayment = async (
  userId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
) => {
  // 1. Verify the payment signature (DIFFERENT from webhook)
  // This uses your KEY SECRET, not webhook secret
  const body = razorpayOrderId + "|" + razorpayPaymentId;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    const err = new Error("Invalid payment signature.");
    err.isOperational = true;
    throw err;
  }

  // 2. We must also check that the user verifying this
  //    is the user who created the order.
  const order = await prisma.order.findFirst({
    where: { razorpayOrderId: razorpayOrderId },
    select: { userId: true },
  });

  if (!order) {
    const err = new Error("Order not found.");
    err.isOperational = true;
    throw err;
  }

  if (order.userId !== userId) {
    const err = new Error(
      "Authorization failed. You cannot verify this order."
    );
    err.isOperational = true;
    throw err;
  }

  // 3. Signature is valid and user is authorized.
  //    Run the same finalization logic as the webhook.
  return prisma.$transaction(async (tx) => {
    return await _finalizeBooking(tx, razorpayOrderId, razorpayPaymentId);
  });
};

// --- ADD THIS HELPER TOO ---
exports.findBookingByRazorpayId = async (razorpayOrderId) => {
  return prisma.order.findFirst({
    where: { razorpayOrderId: razorpayOrderId },
    select: { id: true, userId: true, status: true },
  });
};

exports.getBookings = async (userId) => {
  const orders = await prisma.order.findMany({
    where: {
      userId: userId,
      status: "COMPLETED",
    },
    include: {
      items: {
        include: {
          ticketType: {
            include: {
              event: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // 1. The .map() function just returns the plain booking object
  const bookings = orders
    .map((order) => {
      const firstItem = order.items[0];
      if (!firstItem) {
        return null;
      }
      const event = firstItem.ticketType.event;
      if (!event) {
        return null;
      }

      // --- No "data:" key here ---
      return {
        bookingId: order.id,
        razorpayOrderId: order.razorpayOrderId,
        totalAmount: order.totalAmount,
        bookedAt: order.createdAt,

        // Event Details
        eventTitle: event.title,
        eventSlug: event.slug,
        eventPrimaryImage: event.primaryImage,
        eventStartDate: event.startDate,

        // Ticket Details
        tickets: order.items.map((item) => ({
          name: item.ticketType.name,
          quantity: item.quantity,
          price: item.priceAtPurchase,
        })),
      };
    })
    .filter(Boolean); // Filter out any null (empty) orders

  // 2. Wrap the final 'bookings' array in your standard response object
  return {
    data: bookings,
    pagination: { hasMore: false, nextCursor: null }, // We fetched all, so no more pages
    filters: null, // No filters were applied in this query
  };
};
