const EventService = require("../../services/Events/EventService");
const slugify = require("slugify");
const { updateEventStatusSchema } = require("../../validators/EventValidator");
const { ZodError } = require("zod");

exports.createEvent = async (req, res) => {
  console.log("--- RAW REQUEST ---");
  console.log("BODY:", req.body);
  console.log("FILES:", req.files);
  console.log("--------------------");
  try {
    const validatedData = req.body;
    const creatorId = req.user.id;

    const { title, categoryIds, ticketTypes, ...restOfBody } = validatedData;

    const eventData = {
      ...restOfBody,
      title: title,
      slug: slugify(title, { lower: true, strict: true }),
      creatorId: creatorId,
      categories: {
        connect: categoryIds.map((id) => ({ id })),
      },
    };

    if (validatedData.ticketTypes && validatedData.ticketTypes.length > 0) {
      eventData.ticketTypes = {
        create: validatedData.ticketTypes,
      };
    } else {
      delete eventData.ticketTypes;
    }

    //Move this logic and all image uplaod to a separate function
    // --- 3. Handle File Uploads and Images ---
    const imageUrls = [];
    if (req.files?.images) {
      const images = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];
      imageUrls.push(...images.map((file) => file.path));
    }
    eventData.imageUrls = imageUrls;
    eventData.primaryImage = imageUrls[0] || null;

    const newEvent = await EventService.createEvent(eventData);
    res.status(201).json({
      success: true,
      data: newEvent,
      message: "Event created successfully",
    });
  } catch (error) {
    console.error("Create event error:", error);
    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "An event with this title/slug already exists.",
      });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to create event." });
  }
};

exports.updateEventStatus = async (req, res) => {
  try {
    const dataToValidate = {
      params: req.params,
      body: req.body,
    };

    const { params, body } = updateEventStatusSchema.parse(dataToValidate);
    console.log("Validated Data", params, body);
    // 3. Destructure the CLEAN and VALIDATED data
    const { eventId } = params;
    const { status } = body;

    // 4. Pass the validated data to the service (no parseInt needed!)
    const updatedEvent = await EventService.updateEventStatus(eventId, status);

    if (!updatedEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedEvent,
      message: `Event status successfully updated to ${status}.`,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided.",
        errors: error.flatten(),
      });
    }
    console.error("Error updating event status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update event status.",
    });
  }
};

exports.getPublicEvents = async (req, res) => {
  try {
    const { cursor, limit, sortBy, category } = req.query;
    const options = {
      category: category,
      limit: limit ? parseInt(limit) : 10,
      cursor: cursor ? parseInt(cursor) : undefined,
      sortBy: sortBy,
    };
    const events = await EventService.getAllEvents(options);
    res.status(200).json({ success: true, ...events });
  } catch (error) {
    console.error("Get public events error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getAllEventsForAdmin = async (req, res) => {
  try {
    const userRole = "ADMIN";
    console.log("THis is user role", userRole);
    const { cursor, limit, sortBy } = req.query;
    const options = {
      userRole,
      limit: limit ? parseInt(limit) : 10,
      cursor: cursor ? parseInt(cursor) : undefined,
      sortBy: sortBy,
    };
    const events = await EventService.getAllEvents(options);
    res.status(200).json({ success: true, ...events });
  } catch (error) {
    console.error("Get all events for admin error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getEventbyslug = async (req, res) => {
  try {
    const { slug } = req.params;
    const event = await EventService.getEventBySlug(slug);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getTotalEventsCount = async (req, res) => {
  try {
    const totalEvents = await EventService.getTotalEventsCount();
    res.status(200).json({ success: true, data: { totalEvents: totalEvents } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    await EventService.deleteEvent(id);
    res
      .status(200)
      .json({ success: true, message: "Event deleted successfully." });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Event not found." });
    }
    console.error(error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
