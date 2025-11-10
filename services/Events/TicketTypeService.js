const prisma = require("../../utils/prisma");

exports.createTicketType = async (eventId, ticketData) => {
  const { name, price, quantity } = ticketData;

  return prisma.ticketType.create({
    data: {
      name,
      price: parseFloat(price), // Ensure price is a float
      quantity: parseInt(quantity, 10), // Ensure quantity is an integer
      eventId: eventId,
    },
  });
};

exports.getTicketTypesForEvent = async (eventId) => {
  return prisma.ticketType.findMany({
    where: { eventId: eventId },
    orderBy: { price: "asc" },
  });
};
