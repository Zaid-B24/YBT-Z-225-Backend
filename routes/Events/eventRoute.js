const express = require("express");
const router = express.Router();
const eventController = require("../../controllers/Events/eventController");
const upload = require("../../middleware/upload");
const validate = require("../../validators/Validator");

const {
  createEventSchema,
  DeleteEventSchema,
} = require("../../validators/EventValidator");
const { protect, admin } = require("../../middleware/authMiddleware");

router.post(
  "/",
  protect,
  admin,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 5 },
    { name: "mobileImages", maxCount: 10 },
    { name: "mobileVideos", maxCount: 5 },
  ]),
  validate(createEventSchema),
  eventController.createEvent,
);

router.get("/filters", eventController.getFilters);

router.patch(
  "/:eventId/update-status",
  protect,
  admin,
  eventController.updateEventStatus,
);

router.get("/user", eventController.getPublicEvents);
router.get("/admin", eventController.getAllEventsForAdmin);

router.get(
  "/totaleventscount",
  protect,
  admin,
  eventController.getTotalEventsCount,
);

//add a search endpoint

router.get("/:slug", eventController.getEventbyslug);
router.delete(
  "/:id",
  protect,
  admin,
  validate(DeleteEventSchema),
  eventController.deleteEvent,
);
module.exports = router;
