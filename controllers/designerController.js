const designerService = require("../services/designerService");

//ADD ZOD validation on each endpoint

exports.createDesigner = async (req, res) => {
  try {
    const { name, title, description } = req.body;
    if (!name || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "Name, title, and description are required.",
      });
    }

    const newDesigner = await designerService.createDesigner(req.body);

    res.status(201).json({
      success: true,
      message: "Designer created successfully.",
      data: newDesigner,
    });
  } catch (error) {
    console.error("Failed to create designer:", error);
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A designer with this name or slug already exists.",
      });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to create designer." });
  }
};

exports.getAllDesigners = async (req, res) => {
  try {
    const designers = await designerService.getAllDesigners();
    res.status(200).json({ success: true, data: designers });
  } catch (error) {
    console.error("Failed to fetch designers:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch designers." });
  }
};

exports.getDesignerBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const designer = await designerService.getDesignerBySlug(slug);

    if (!designer) {
      return res
        .status(404)
        .json({ success: false, message: "Designer not found." });
    }
    res.status(200).json({ success: true, data: designer });
  } catch (error) {
    console.error("Failed to fetch designer:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch designer." });
  }
};

exports.getDesignerById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid designer ID provided." });
    }
    const designer = await designerService.getDesignerById(id);

    if (!designer) {
      return res
        .status(404)
        .json({ success: false, message: "Designer not found." });
    }
    res.status(200).json({ success: true, data: designer });
  } catch (error) {
    console.error(`Failed to get designer ${req.params.id}:`, error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch designer." });
  }
};

exports.deleteDesigner = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid designer ID provided." });
    }
    await designerService.deleteDesignerById(id);
    res
      .status(200)
      .json({ success: true, message: "Designer deleted successfully." });
  } catch (error) {
    console.error("Error deleting designer:", error);
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Designer not found." });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to delete designer." });
  }
};
