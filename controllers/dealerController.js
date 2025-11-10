const dealerService = require("../services/dealerService");

//Add zod validation for all endpoints so that controller looks clean

exports.createDealer = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required fields.",
      });
    }
    const newDealer = await dealerService.createDealer(req.body);
    res.status(201).json({
      success: true,
      message: "Dealer created successfully.",
      data: newDealer,
    });
  } catch (error) {
    console.error("Failed to create dealer:", error);
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A dealer with this email already exists.",
      });
    }
    res
      .status(500)
      .json({ success: false, message: "Unable to create dealer." });
  }
};

exports.getAllDealers = async (req, res) => {
  try {
    const dealers = await dealerService.getAllDealers();
    res.status(200).json({ success: true, data: dealers });
  } catch (error) {
    console.error("Failed to fetch dealers:", error);
    res
      .status(500)
      .json({ success: false, message: "Unable to fetch dealers." });
  }
};

exports.getDealerDetails = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid dealer ID provided." });
    }
    const dealer = await dealerService.getDealerDetails(id);
    if (!dealer) {
      return res
        .status(404)
        .json({ success: false, message: "Dealer not found." });
    }
    res.status(200).json({ success: true, data: dealer });
  } catch (error) {
    console.error("Failed to fetch dealer details:", error);
    res
      .status(500)
      .json({ success: false, message: "Unable to fetch dealer details." });
  }
};

exports.updateDealer = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid dealer ID provided." });
    }
    const updatedDealer = await dealerService.updateDealerById(id, req.body);
    res.status(200).json({
      success: true,
      message: "Dealer updated successfully.",
      data: updatedDealer,
    });
  } catch (error) {
    console.error("Failed to update dealer:", error);
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Dealer not found." });
    }
    res
      .status(500)
      .json({ success: false, message: "Unable to update dealer." });
  }
};

exports.deleteDealer = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid dealer ID provided." });
    }
    await dealerService.deleteDealerById(id);
    res
      .status(200)
      .json({ success: true, message: "Dealer deleted successfully." });
  } catch (error) {
    console.error("Failed to delete dealer:", error);
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Dealer not found." });
    }
    res
      .status(500)
      .json({ success: false, message: "Unable to delete dealer." });
  }
};
