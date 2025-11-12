const adminHomePageService = require("../services/adminHomePageService");

exports.createHeroSlide = async (req, res) => {
  try {
    const {
      order,
      carId,
      eventId,
      customTitle,
      customSubtitle,
      customLinkUrl,
      customAssetUrl,
      customAssetType, // "IMAGE" or "VIDEO"
      isActive,
    } = req.body;

    if (!customAssetUrl && !carId && !eventId) {
      return res.status(400).json({
        success: false,
        message:
          "A slide must have a custom asset or be linked to a car/event.",
      });
    }

    const slideData = {
      order: order ? parseInt(order) : 0,
      carId: carId ? parseInt(carId) : null,
      eventId: eventId ? parseInt(eventId) : null,
      customTitle,
      customSubtitle,
      customLinkUrl,
      customAssetUrl,
      customAssetType,
      isActive: isActive === undefined ? true : Boolean(isActive),
    };

    const newSlide = await adminHomePageService.createHeroSlide(slideData);

    res.status(201).json({
      success: true,
      message: "Hero slide created successfully",
      data: newSlide,
    });
  } catch (error) {
    console.error("Error creating hero slide:", error);
    if (error.code === "P2003") {
      return res.status(400).json({
        success: false,
        message: "Invalid carId or eventId. The linked item does not exist.",
      });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to create hero slide." });
  }
};

exports.getHeroSlides = async (req, res) => {
  try {
    const slides = await adminHomePageService.getHeroSlides();
    res.status(200).json({
      success: true,
      message: "Fetched hero slides",
      data: slides,
    });
  } catch (error) {
    console.error("Error creating hero slide:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create fetch slides." });
  }
};

exports.deleteHeroSLide = async (req, res) => {
  try {
    const slideid = parseInt(req.params.id, 10);
    if (isNaN(slideid)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid slide ID provided." });
    }

    await adminHomePageService.deleteslide(slideid);
    res.status(200).json({
      success: true,
      message: "Slide deleted successfully.",
    });
  } catch (error) {
    console.error("Error in deleteSlide:", error);
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Slide not found." });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to delete Slide." });
  }
};

const updateHeroSlide = async ({ slideId, slideData }) => {
  const token = localStorage.getItem("adminToken");
  if (!token) throw new Error("No admin token found");

  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/homeslide/${slideId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(slideData),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update slide");
  }
  return data;
};

exports.updateHeroSlide = async (req, res) => {
  try {
    const slideId = parseInt(req.params.id, 10);
    if (isNaN(slideId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid slide ID." });
    }

    const { carId, eventId, customTitle, customSubtitle, isActive } = req.body;

    const slideData = {
      carId: carId ? parseInt(carId) : null,
      eventId: eventId ? parseInt(eventId) : null,
      customTitle: customTitle || null,
      customSubtitle: customSubtitle || null,
      isActive: Boolean(isActive),
    };

    const updatedSlide = await adminHomePageService.updateSlide(
      slideId,
      slideData
    );

    res.status(200).json({
      success: true,
      message: "Slide updated successfully",
      data: updatedSlide,
    });
  } catch (error) {
    console.error("Error updating hero slide:", error);
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Slide not found." });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to update slide." });
  }
};

exports.reorderHeroSlides = async (req, res) => {
  try {
    const { slideOrder } = req.body;
    if (!Array.isArray(slideOrder)) {
      return res.status(400).json({
        success: false,
        message: "Invalid data format. 'slideOrder' must be an array.",
      });
    }
    await adminHomePageService.reorderSlides(slideOrder);
    res.status(200).json({
      success: true,
      message: "Slide order updated successfully",
    });
  } catch (error) {
    console.error("Error reordering slides:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to reorder slides." });
  }
};
