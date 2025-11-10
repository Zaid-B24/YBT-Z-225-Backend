const CategoryService = require("../../services/Events/CategoryService");

exports.createEventCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "The 'name' field is required." });
    }
    const newEventCategory = await CategoryService.createEventCategory(
      req.body
    );
    res.status(201).json({
      success: true,
      message: "Event Category created successfully",
      data: newEventCategory,
    });
  } catch (error) {
    console.error("create event category error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "An event category with this name already exists.",
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to create event category",
    });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await CategoryService.getAllCategories();
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get all categories error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to retrieve categories" });
  }
};
