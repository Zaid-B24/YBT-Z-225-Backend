const bcrypt = require("bcrypt");
const authService = require("../services/authService");
const sessionService = require("../services/sessionService");
const prisma = require("../utils/prisma");

exports.register = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  try {
    if (!name || !email || !password || !confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match." });
    }
    const result = await authService.registerUser(name, email, password);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    if (error.message === "EmailAlreadyInUse") {
      return res
        .status(409)
        .json({ success: false, message: "This email is already in use." });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error during registration." });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });

    const user = await authService.login(email, password);

    await sessionService.createSession(req, user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error(error);
    if (error.message === "InvalidCredentials") {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error during login." });
  }
};

exports.logout = async (req, res) => {
  try {
    await sessionService.destroySession(req, res);
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error during logout.",
    });
  }
};

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });

    const user = await authService.loginAdmin(email, password);

    await sessionService.createSession(req, user);

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error(error);
    if (error.message === "AuthorizationFailed") {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials or insufficient permissions.",
      });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error during admin login." });
  }
};
