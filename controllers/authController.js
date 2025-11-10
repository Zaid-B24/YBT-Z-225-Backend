const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authService = require("../services/authService");
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

    const result = await authService.login(email, password);
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
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

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });

    const result = await authService.loginAdmin(email, password);
    console.log("THis is admin login result", result);
    res.status(200).json({
      success: true,
      message: "Admin login successful",
      data: result,
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
