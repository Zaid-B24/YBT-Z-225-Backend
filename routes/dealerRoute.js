const express = require("express");
const router = express.Router();
const dealerController = require("../controllers/dealerController");
const { protect, admin } = require("../middleware/authMiddleware");

router.post("/register", protect, admin, dealerController.createDealer);
router.get("/:id", dealerController.getDealerDetails);
router.get("/", protect, admin, dealerController.getAllDealers);
router.put("/:id", protect, admin, dealerController.updateDealer);
router.delete("/:id", protect, admin, dealerController.deleteDealer);

module.exports = router;
