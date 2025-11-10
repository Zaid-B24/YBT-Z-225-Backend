const ticketTypeService = require("../../services/Events/TicketTypeService");

exports.createTicketType = async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    if (isNaN(eventId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Event ID." });
    }
    const newTicketType = await ticketTypeService.createTicketType(
      parseInt(eventId, 10),
      req.body
    );
    res.status(201).json({
      success: true,
      message: "Ticket type created successfully",
      data: newTicketType,
    });
  } catch (error) {
    console.error("Create ticket type error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create ticket type" });
  }
};
