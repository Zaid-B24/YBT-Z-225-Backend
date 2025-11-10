const express = require("express");
const router = express.Router();
const bikeController = require("../controllers/bikeController");
const upload = require("../middleware/upload");
const validate = require("../validators/Validator");
const {
  createBikeSchema,
  updateBikeSchema,
  bikeIdParamSchema,
} = require("../validators/bikeValidator");
const { protect, admin } = require("../middleware/authMiddleware");

router.post(
  "/",
  protect,
  admin,
  upload.fields([{ name: "bikeImages", maxCount: 10 }]),
  validate(createBikeSchema),
  bikeController.createBike
);
router.get("/", bikeController.getAllBikes);
router.get("/count", bikeController.getTotalBikes);
router.get("/:id", validate(bikeIdParamSchema), bikeController.getBikeById);
router.put("/:id", validate(updateBikeSchema), bikeController.updateBike);
router.delete("/:id", validate(bikeIdParamSchema), bikeController.deleteBike);

module.exports = router;
