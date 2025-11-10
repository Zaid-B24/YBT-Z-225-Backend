const prisma = require("../utils/prisma");

exports.getVehiclesCount = async (req, res) => {
  try {
    //currently doesnt need a dedicated service, only required on admin dashboard
    const [carCount, bikeCount] = await Promise.all([
      prisma.car.count(),
      prisma.bike.count(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalVehicles: carCount + bikeCount,
        cars: carCount,
        bikes: bikeCount,
      },
    });
  } catch (error) {
    console.error("Failed to get vehicle counts:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch vehicle counts." });
  }
};

exports.searchVehicles = async (req, res) => {
  try {
    // --- 1. Get All Parameters ---
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 12;
    const skip = (page - 1) * pageSize;

    const { brands, locations, categories, search, sort } = req.query;

    // --- 2. Build Dynamic WHERE Clause ---
    const where = {};
    if (brands) {
      where.brand = { in: brands.split(",") }; // Handle multiple brands
    }
    if (locations) {
      where.city = { in: locations.split(",") }; // Assuming filter is by city
    }
    if (search) {
      where.OR = [
        // Search in title OR description
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // For categories, you'd query multiple models. Using raw SQL is best here.
    // For simplicity, let's assume we're just filtering Cars for now.
    // A full implementation would use the UNION ALL strategy we discussed.

    // --- 3. Build Dynamic ORDER BY Clause ---
    const orderBy = {};
    if (sort === "price-asc") {
      orderBy.sellingPrice = "asc";
    } else if (sort === "price-desc") {
      orderBy.sellingPrice = "desc";
    } else {
      orderBy.createdAt = "desc"; // Default sort
    }

    // --- 4. Execute Queries ---
    const [total, items] = await prisma.$transaction([
      prisma.car.count({ where }), // For simplicity, only counting cars
      prisma.car.findMany({
        where,
        take: pageSize,
        skip,
        orderBy,
      }),
    ]);

    res.json({
      data: items,
      pagination: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
