const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const workShopController = require("../controllers/workshopController");

router.post(
  "/",
  upload.fields([{ name: "image", maxCount: 10 }]),
  workShopController.createWorkshop
);

router.get("/", workShopController.getAllWorkshops);
router.get("/:id", workShopController.getWorkshopByid);
router.get("/slug/:slug", workShopController.getWorkshopBySlug);

module.exports = router;
