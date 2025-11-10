const { z } = require("zod");
const validate = require("./Validator");

const VehicleStatus = z.enum(["AVAILABLE", "SOLD", "PENDING", "RESERVED"]);
const FuelType = z.enum(["PETROL", "DIESEL", "ELECTRIC", "HYBRID", "CNG"]);
const CollectionType = z.enum(["YBT", "DESIGNER", "WORKSHOP", "TORQUE_TUNER"]);
const createBikeSchema = z.object({
  body: z.object({
    // --- Core Details ---
    title: z.string({ required_error: "Title is required." }).min(3),
    description: z.string().optional(),
    brand: z.string().optional(),
    bikeUSP: z.string().optional(),

    // --- Ownership & History ---
    registrationYear: z.coerce.number().int().min(1900),
    registrationNumber: z.string({
      required_error: "Registration number is required.",
    }),
    kmsDriven: z.coerce.number().int().min(0),
    ownerCount: z.coerce.number().int().positive().optional(),
    insurance: z.string().optional(),

    // --- Pricing ---
    ybtPrice: z.coerce
      .number({ required_error: "YBT price is required." })
      .positive(),
    sellingPrice: z.coerce.number().positive().optional(),
    cutOffPrice: z.coerce.number().positive().optional(),

    // --- Specifications ---
    // FIX: Transform comma-separated strings into arrays
    badges: z
      .string()
      .optional()
      .transform((val) => (val ? val.split(",").map((s) => s.trim()) : [])),
    specs: z
      .string()
      .optional()
      .transform((val) => (val ? val.split(",").map((s) => s.trim()) : [])),
    engine: z.string().optional(),
    vipNumber: z.coerce.boolean().optional().default(false),

    // --- Categorization ---
    collectionType: CollectionType.optional(),
    fuelType: FuelType.optional(),
    status: VehicleStatus.optional(),

    // --- Relations ---
    dealerId: z.coerce
      .number({ required_error: "Dealer ID is required." })
      .int()
      .positive(),
  }),

  // 3. Add validation for file uploads
  files: z
    .any()
    .refine(
      (files) => files?.bikeImages?.length > 0,
      "At least one bike image is required."
    ),
});

const updateBikeSchema = z.object({
  body: createBikeSchema.shape.body.partial(), // .partial() makes all fields optional
  params: z.object({
    id: z.coerce.number().int().positive("Bike ID must be a positive integer."),
  }),
  files: z.any().optional(), // Files are optional during an update
});

const bikeIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Bike ID must be a positive integer."),
  }),
});

module.exports = {
  createBikeSchema,
  updateBikeSchema,
  bikeIdParamSchema,
};
