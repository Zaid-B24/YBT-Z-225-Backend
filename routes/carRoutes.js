const express = require("express");
const router = express.Router();
const carController = require("../controllers/carController");
const upload = require("../middleware/upload");
const validate = require("../validators/Validator");
const { protect, admin } = require("../middleware/authMiddleware");
const {
  createCarSchema,
  getCarByIdSchema,
  getCarsByDealerSchema,
  updateCarSchema,
} = require("../validators/car.validator");

router.post(
  "/",
  protect,
  admin,
  upload.fields([{ name: "carImages", maxCount: 10 }]),
  validate(createCarSchema),
  carController.createCar
);

router.get("/", carController.getAllCars);
router.get("/count", carController.getTotalCars);
router.get("/:id", validate(getCarByIdSchema), carController.getCarById);
router.get(
  "/dealer/:dealerId",
  validate(getCarsByDealerSchema),
  carController.getCarsByDealer
);
router.put(
  "/:id",
  upload.fields([{ name: "carImages", maxCount: 10 }]),
  validate(updateCarSchema),
  carController.updateCar
);
// router.post("/:carId/book", protect, carController.bookCar);
// router.post("/:carId/guest-book", carController.createGuestBooking);
router.delete("/:id", carController.deleteCar);

module.exports = router;
