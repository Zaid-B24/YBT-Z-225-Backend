const { z } = require("zod");

const initiateBookingSchema = z.object({
  body: z.object({
    eventId: z.coerce.number().int().positive(),
    items: z
      .array(
        z.object({
          ticketTypeId: z.coerce.number().int().positive(),
          quantity: z.coerce
            .number()
            .int()
            .positive("Quantity must be at least 1."),
        })
      )
      .min(1, "You must select at least one ticket."),
  }),
});

module.exports = { initiateBookingSchema };
