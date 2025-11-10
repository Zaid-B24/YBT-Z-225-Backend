const prisma = require("../utils/prisma");

exports.createWorkshop = async (req, res) => {
  const { name, title, description, image, stats, slug } = req.body;

  if (!name || !title || !description) {
    return res
      .status(400)
      .json({ message: "Name, title, and description are required." });
  }

  try {
    const workshop = await prisma.workshop.create({
      data: {
        name,
        title,
        description,
        slug,
        image: image || "https://placehold.co/800x600?text=No+Image",
        stats: stats || {},
      },
    });
    res.status(201).json(workshop);
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ message: "A workshop with this name already exists." });
    }
    console.error("💥 FAILED TO CREATE WORKSHOP:", error);
    res
      .status(500)
      .json({ message: "Failed to create workshop", error: error.message });
  }
};

exports.getAllWorkshops = async (req, res) => {
  try {
    const workshop = await prisma.workshop.findMany({
      orderBy: { name: "asc" },
    });
    res.status(200).json(workshop);
  } catch (error) {
    console.error("💥 FAILED TO GET WORKSHOP:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch workshop", error: error.message });
  }
};

exports.getWorkshopBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    const workshop = await prisma.workshop.findUnique({
      where: { slug },
    });
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found." });
    }
    res.status(200).json(workshop);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch workshop", error: error.message });
  }
};

exports.getWorkshopByid = async (req, res) => {
  const { id } = req.params;
  try {
    const workshop = await prisma.workshop.findUnique({
      where: { id: parseInt(id) },
    });
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found." });
    }
    res.status(200).json(workshop);
  } catch (error) {
    console.error(`💥 FAILED TO GET WORKSHOP ${id}:`, error);
    res
      .status(500)
      .json({ message: "Failed to fetch workshop", error: error.message });
  }
};

exports.deleteWorkShop = async (req, res) => {
  const { id } = req.params;
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid Workshop ID provided." });
  }
  try {
    const deleteWorkShop = await prisma.workshop.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      message: "Workshop deleted successfully.",
      deletedId: deleteWorkShop.id,
    });
  } catch (error) {
    console.error("Error in deleteWorkshop:", error);
    res.status(500).json({ error: "Failed to delete workshop." });
  }
};
