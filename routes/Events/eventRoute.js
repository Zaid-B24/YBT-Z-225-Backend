const express = require("express");
const router = express.Router();
const eventController = require("../../controllers/Events/eventController");
const upload = require("../../middleware/upload");
const validate = require("../../validators/Validator");

const debugMiddleware = (req, res, next) => {
  console.log("--- INSPECTING REQUEST BEFORE ZOD VALIDATION ---");
  console.log("req.body:", req.body);
  console.log("req.files:", req.files);
  console.log("-------------------------------------------------");
  next(); // Pass control to the next middleware (Zod)
};
const {
  createEventSchema,
  DeleteEventSchema,
} = require("../../validators/EventValidator");
const {
  protect,
  admin,
  identifyUser,
} = require("../../middleware/authMiddleware");

router.post(
  "/",
  protect,
  admin,
  upload.fields([{ name: "images", maxCount: 10 }]),
  debugMiddleware,
  validate(createEventSchema),
  eventController.createEvent
);

router.patch(
  "/:eventId/update-status",
  protect,
  admin,
  eventController.updateEventStatus
);

router.get(
  "/user",
  //identifyUser,
  eventController.getPublicEvents
);
router.get(
  "/admin",
  //protect,
  //admin,
  eventController.getAllEventsForAdmin
);

router.get(
  "/totaleventscount",
  protect,
  admin,
  eventController.getTotalEventsCount
);

//add a search endpoint

router.get("/:slug", eventController.getEventbyslug);
router.delete(
  "/:id",
  protect,
  admin,
  validate(DeleteEventSchema),
  eventController.deleteEvent
);
module.exports = router;
