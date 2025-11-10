const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, admin } = require("../middleware/authMiddleware");

router.get("/", protect, admin, userController.getUsers);
router.get("/totalusers", protect, admin, userController.totalUsers);
router.put("/update-profile", protect, userController.updateUserDetails);
router.put("/update-password", protect, userController.updatePassword);

module.exports = router;
