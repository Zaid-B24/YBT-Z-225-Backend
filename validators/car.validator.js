const { z } = require("zod");

const VehicleStatus = z.enum(["AVAILABLE", "SOLD", "PENDING", "RESERVED"]);
const FuelType = z.enum(["PETROL", "DIESEL", "ELECTRIC", "HYBRID", "CNG"]);
const DriveType = z.enum(["FWD", "RWD", "AWD", "FOUR_WD"]);
const CollectionType = z.enum(["YBT", "DESIGNER", "WORKSHOP", "TORQUE_TUNER"]);
const Stage = z.enum(["STAGE1", "STAGE2", "STAGE3"]);

const createCarSchema = z.object({
  body: z
    .object({
      // --- Core Details ---
      title: z.string().min(3, "Title must be at least 3 characters."),
      description: z.string().optional(),
      status: VehicleStatus.optional(),

      // --- Collection & Dealer ---
      dealerId: z.coerce
        .number({ required_error: "Please select a dealer." })
        .int()
        .positive(),
      collectionType: CollectionType,
      designerId: z.coerce.number().int().positive().optional(),
      workshopId: z.coerce.number().int().positive().optional(),
      tuningStage: Stage.optional(),

      // --- Pricing ---
      sellingPrice: z.coerce.number().positive(),
      cutOffPrice: z.coerce.number().positive(),
      ybtPrice: z.coerce.number().positive(),

      // --- Ownership & History ---
      registrationYear: z.coerce.number().int().min(1900),
      registrationNumber: z
        .string()
        .nonempty("Registration number is required."),
      kmsDriven: z.coerce.number().int().min(0),
      insurance: z.string().optional(),
      manufactureYear: z.coerce.number().int().min(1900).optional(),
      ownerCount: z.coerce.number().int().min(1).optional(),

      // --- Car Specifications ---
      brand: z.string().optional(),
      fuelType: FuelType.optional(), // Make optional or provide a default in the controller if needed
      badges: z
        .string()
        .optional()
        .transform((val) => (val ? val.split(",").map((s) => s.trim()) : [])),
      specs: z
        .string()
        .optional()
        .transform((val) => (val ? val.split(",").map((s) => s.trim()) : [])),
      features: z
        .string()
        .optional()
        .transform((val) => (val ? val.split(",").map((s) => s.trim()) : [])),
      vipNumber: z.coerce.boolean().optional().default(false),
      city: z.string().optional(),
      state: z.string().optional(),
      carUSP: z.string().optional(),
      carType: z.string().optional(),
      transmission: z.string().optional(),
      exteriorColour: z.string().optional(),
      peakTorque: z.string().optional(),
      peakPower: z.string().optional(),
      engine: z.string().optional(),
      driveType: DriveType.optional(),
      mileage: z.coerce.number().min(0).optional(),
      doors: z.coerce.number().int().positive().optional(),
      seatingCapacity: z.coerce.number().int().positive().optional(),
    })
    .refine(
      (data) => {
        if (data.collectionType === "DESIGNER") {
          return !!data.designerId && !data.workshopId;
        }
        return true;
      },
      {
        message: "A Designer car must have a designer ID and no workshop ID.",
        path: ["designerId"],
      }
    )
    .refine(
      (data) => {
        if (data.collectionType === "WORKSHOP") {
          return !!data.workshopId && !data.designerId;
        }
        return true;
      },
      {
        message: "A Workshop car must have a workshop ID and no designer ID.",
        path: ["workshopId"],
      }
    ),

  // --- File validation ---
  files: z
    .any()
    .refine(
      (files) => files?.carImages?.length > 0,
      "At least one car image is required."
    ),
});

const updateCarSchema = z.object({
  body: createCarSchema.shape.body.partial(),
  params: z.object({
    id: z.coerce.number().int().positive("ID must be a positive integer."),
  }),
  files: z.any().optional(),
});

const getCarByIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("ID must be a positive integer."),
  }),
});

const getCarsByDealerSchema = z.object({
  params: z.object({
    dealerId: z.coerce
      .number()
      .int()
      .positive("Dealer ID must be a positive integer."),
  }),
});

module.exports = {
  createCarSchema,
  getCarByIdSchema,
  getCarsByDealerSchema,
  updateCarSchema,
};
