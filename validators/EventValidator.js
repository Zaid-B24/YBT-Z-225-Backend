const { z } = require("zod");

// Schema for a single TicketType object within the JSON string
const ticketTypeSchema = z
  .object({
    name: z
      .string({ required_error: "Ticket name is required." })
      .min(3, "Ticket name must be at least 3 characters."),
    price: z.coerce
      .number({ required_error: "Ticket price is required." })
      .positive("Price must be a positive number."),
    quantity: z.coerce
      .number({ required_error: "Ticket quantity is required." })
      .int("Quantity must be a whole number.")
      .positive("Quantity must be a positive number."),
    saleStartDate: z.coerce.date().optional(),
    saleEndDate: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      // If both dates are provided, ensure end date is after start date
      if (data.saleStartDate && data.saleEndDate) {
        return data.saleEndDate > data.saleStartDate;
      }
      return true; // Validation passes if one or both dates are missing
    },
    {
      message: "Ticket sale end date must be after the start date.",
      path: ["saleEndDate"], // specify which field the error belongs to
    }
  );

// Main schema for creating an event
const createEventSchema = z
  .object({
    body: z.object({
      title: z
        .string({ required_error: "Title is required." })
        .min(3, "Title must be at least 3 characters long."),

      description: z.string().optional(),

      location: z.string(),

      startDate: z.coerce.date({ required_error: "Start date is required." }),

      endDate: z.coerce.date({ required_error: "End date is required." }),

      type: z.enum(["PUBLIC", "PRIVATE"]).optional(),

      status: z
        .enum(["DRAFT", "PUBLISHED", "COMPLETED", "CANCELLED"])
        .optional(),

      isFeatured: z.coerce.boolean().optional(),

      // Handles comma-separated string => string[]
      facilities: z
        .string()
        .optional()
        .transform((val) =>
          val ? val.split(",").map((s) => s.trim()) : undefined
        ),

      youshouldKnow: z
        .string()
        .optional()
        .transform((val) =>
          val ? val.split(",").map((s) => s.trim()) : undefined
        ),

      // Handles JSON string => number[]
      categoryIds: z
        .string({ required_error: "Category IDs are required." })
        .transform((val, ctx) => {
          let parsedIds;

          // Check if the input is a JSON array string
          if (val.startsWith("[") && val.endsWith("]")) {
            try {
              parsedIds = JSON.parse(val);
            } catch (e) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Invalid JSON format for categoryIds.",
              });
              return z.NEVER;
            }
          } else {
            // Otherwise, treat it as a comma-separated string (works for single IDs too)
            parsedIds = val.split(",").map((s) => s.trim());
          }

          // Now, validate that the result is an array of positive integers
          const numberArraySchema = z.array(z.coerce.number().int().positive());
          const validationResult = numberArraySchema.safeParse(parsedIds);

          if (!validationResult.success) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "categoryIds must contain valid numbers.",
            });
            return z.NEVER;
          }

          return validationResult.data;
        }),

      // Handles JSON string => object[] with further validation
      ticketTypes: z
        .string()
        .optional()
        .transform((val, ctx) => {
          if (!val) return undefined;
          try {
            return JSON.parse(val);
          } catch (e) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Invalid JSON format for ticketTypes.",
            });
            return z.NEVER;
          }
        })
        .pipe(z.array(ticketTypeSchema).optional()),
    }),
    files: z
      .any()
      .refine(
        (files) => files?.images?.length > 0,
        "At least one event image is required."
      )
      .refine(
        (files) => files?.images?.length <= 10,
        "You can upload a maximum of 10 images."
      ),
  })
  .refine((data) => data.body.endDate > data.body.startDate, {
    message: "Event end date must be after the start date.",
    path: ["body.endDate"],
  });

const DeleteEventSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Bike ID must be a positive integer."),
  }),
});

const updateEventStatusSchema = z.object({
  body: z.object({
    status: z.enum(["DRAFT", "PUBLISHED", "COMPLETED", "CANCELLED"]),
  }),
  params: z.object({
    eventId: z.coerce
      .number()
      .int()
      .positive("Event ID must be a positive integer."),
  }),
});

module.exports = {
  createEventSchema,
  DeleteEventSchema,
  updateEventStatusSchema,
};
