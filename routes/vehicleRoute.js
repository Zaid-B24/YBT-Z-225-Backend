const express = require("express");
const router = express.Router();

const vehicleController = require("../controllers/vehicleController");

router.get("/count", vehicleController.getVehiclesCount);
module.exports = router;
