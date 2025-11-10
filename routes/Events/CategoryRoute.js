const express = require("express");
const router = express.Router();
const CategoryController = require("../../controllers/Events/CategoryController");
const { protect, admin } = require("../../middleware/authMiddleware");

router.get("/", CategoryController.getAllCategories);
router.post("/", protect, admin, CategoryController.createEventCategory);

module.exports = router;
