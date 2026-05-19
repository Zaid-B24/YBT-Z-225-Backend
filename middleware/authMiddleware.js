const sessionService = require("../services/sessionService");
const prisma = require("../utils/prisma");

const protect = async (req, res, next) => {
  try {
    const user = sessionService.getSessionUser(req);

    if (!user) {
      return res.status(401).json({ message: "Not authorized, no session" });
    }

    req.user = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Not authorized, session failed" });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === "ADMIN") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin" });
  }
};

const identifyUser = async (req, res, next) => {
  try {
    const user = sessionService.getSessionUser(req);

    if (user) {
      req.user = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, name: true, email: true, role: true },
      });
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error("Optional auth error:", error.message);
    req.user = null;
    next();
  }
};

module.exports = { protect, admin, identifyUser };
