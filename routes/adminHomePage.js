const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const adminHomePageController = require("../controllers/adminHomePageController");

router.post("/", protect, admin, adminHomePageController.createHeroSlide);
router.get("/", protect, admin, adminHomePageController.getHeroSlides);
router.put(
  "/reorder",
  protect,
  admin,
  adminHomePageController.reorderHeroSlides
);
router.delete("/:id", protect, admin, adminHomePageController.deleteHeroSLide);
router.put("/:id", protect, admin, adminHomePageController.updateHeroSlide);

module.exports = router;
