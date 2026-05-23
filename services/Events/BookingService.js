const prisma = require("../../utils/prisma");
const razorpay = require("../../config/razorpay");
const crypto = require("crypto");
const redisService = require("../redisService");

const CouponService = require("./CouponService");

const _finalizeBooking = async (tx, razorpayOrderId, razorpayPaymentId) => {
  const order = await tx.order.findFirst({
    where: { razorpayOrderId: razorpayOrderId },
    include: { items: { include: { ticketType: true } } },
  });
  if (!order) {
    console.log(`Order ${razorpayOrderId} does not exist in DB.`);
    return null;
  }
  if (order.status === "COMPLETED") {
    console.log(`Order ${razorpayOrderId} is already fully processed.`);
    return order;
  }

  const completedOrder = await tx.order.update({
    where: { id: order.id },
    data: {
      status: "COMPLETED",
      razorpayPaymentId: razorpayPaymentId,
    },
  });

  const registrationPromises = order.items.flatMap((item) =>
    Array.from({ length: item.quantity }, () =>
      tx.eventRegistration.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          eventId: item.ticketType.eventId,
          ticketTypeId: item.ticketTypeId,
        },
      }),
    ),
  );
  await Promise.all(registrationPromises);

  const lockPromises = order.items.map((item) =>
    redisService.releaseLock(item.ticketTypeId, item.quantity),
  );
  await Promise.all(lockPromises);

  return completedOrder;
};

exports.initiateBooking = async (userId, eventId, items, couponCode) => {
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
        `Not enough tickets for '${ticketType.name}'. Only ${available} available.`,
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
      let baseAmount = 0;

      const orderItemsData = [];

      for (const item of items) {
        const ticketType = await tx.ticketType.findUnique({
          where: { id: item.ticketTypeId },
        });

        if (ticketType.quantity < item.quantity) {
          throw new Error(
            `Someone just booked the last tickets for '${ticketType.name}'.`,
          );
        }

        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: { quantity: { decrement: item.quantity } },
        });

        baseAmount += ticketType.price * item.quantity;

        orderItemsData.push({
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
          priceAtPurchase: ticketType.price,
        });
      }

      const pricing = await CouponService.applyDiscount(
        couponCode,
        baseAmount,
        eventId,
        tx,
      );

      return tx.order.create({
        data: {
          userId,
          totalAmount: pricing.finalAmount,
          discountAmount: pricing.discountAmount,
          couponId: pricing.couponId,
          status: "PENDING",
          items: { create: orderItemsData },
        },
        include: { items: true },
      });
    });

    try {
      for (const item of items) {
        await redisService.releaseLock(item.ticketTypeId, item.quantity);
      }
    } catch (e) {
      console.warn("Post-transaction lock release failed (harmless):", e);
    }
  } catch (error) {
    console.error("🔥 RAW TRANSACTION ERROR:", error);
    for (const item of items) {
      await redisService.releaseLock(item.ticketTypeId, item.quantity);
    }
    const finalError = new Error(
      error.isOperational
        ? error.message
        : "Failed to confirm ticket availability.",
    );
    finalError.isOperational = error.isOperational || true;
    throw finalError;
  }

  const razorpayOptions = {
    amount: Math.round(pendingOrder.totalAmount * 100),
    currency: "INR",
    receipt: `receipt_order_${pendingOrder.id}`,
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
      }
    });
    throw new Error("Failed to create payment order. Please try again.");
  }
};

exports.confirmBooking = async (webhookBody, signature) => {
  const bodyData = Buffer.isBuffer(webhookBody)
    ? webhookBody
    : JSON.stringify(webhookBody);
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(bodyData)
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new Error("InvalidWebhookSignature");
  }
  const parsedBody = Buffer.isBuffer(webhookBody)
    ? JSON.parse(webhookBody.toString())
    : webhookBody;

  const razorpayOrderId = parsedBody.payload.payment.entity.order_id;
  const razorpayPaymentId = parsedBody.payload.payment.entity.id;

  if (!razorpayOrderId) {
    throw new Error("OrderIdMissingFromPayload");
  }

  return prisma.$transaction(async (tx) => {
    return await _finalizeBooking(tx, razorpayOrderId, razorpayPaymentId);
  });
};

exports.verifyPayment = async (
  userId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
) => {
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
      "Authorization failed. You cannot verify this order.",
    );
    err.isOperational = true;
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    return await _finalizeBooking(tx, razorpayOrderId, razorpayPaymentId);
  });
};

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

      return {
        bookingId: order.id,
        razorpayOrderId: order.razorpayOrderId,
        totalAmount: order.totalAmount,
        bookedAt: order.createdAt,

        eventTitle: event.title,
        eventSlug: event.slug,
        eventPrimaryImage: event.thumbnail,
        eventStartDate: event.startDate,

        tickets: order.items.map((item) => ({
          name: item.ticketType.name,
          quantity: item.quantity,
          price: item.priceAtPurchase,
        })),
      };
    })
    .filter(Boolean);

  return {
    data: bookings,
    pagination: { hasMore: false, nextCursor: null },
    filters: null,
  };
};
