const userService = require("../services/userService");

exports.getUsers = async (req, res) => {
  try {
    const users = await userService.getUsers();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

exports.totalUsers = async (req, res) => {
  try {
    const totalUsers = await userService.totalUsers();
    res.status(200).json({
      success: true,
      data: {
        totalUsers: totalUsers,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

exports.updateUserDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      phoneNumber,
      DOB,
      gender,
      address,
      city,
      state,
      zipCode,
      country,
    } = req.body;

    const dataToUpdate = {};
    if (name) dataToUpdate.name = name;
    if (phoneNumber) dataToUpdate.phoneNumber = phoneNumber;
    if (address) dataToUpdate.address = address;
    if (city) dataToUpdate.city = city;
    if (state) dataToUpdate.state = state;
    if (zipCode) dataToUpdate.zipCode = zipCode;
    if (country) dataToUpdate.country = country;

    if (DOB) {
      const dobDate = new Date(DOB);
      if (isNaN(dobDate.getTime())) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Date of Birth format." });
      }
      dataToUpdate.DOB = dobDate.toISOString();
    }

    if (gender) {
      const validGenders = ["MALE", "FEMALE", "OTHER"];
      if (!validGenders.includes(gender.toUpperCase())) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid gender value." });
      }
      dataToUpdate.gender = gender.toUpperCase();
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update were provided.",
      });
    }

    const updatedUser = await userService.updateUserById(userId, dataToUpdate);

    res.status(200).json({
      success: true,
      message: "User details updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user details:", error);

    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating user details",
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All password fields are required." });
    }

    if (newPassword !== confirmNewPassword) {
      return res
        .status(400)
        .json({ success: false, message: "New passwords do not match." });
    }

    await userService.changeUserPassword(userId, currentPassword, newPassword);

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Error updating password:", error);

    if (error.message === "UserNotFound") {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    if (error.message === "IncorrectCurrentPassword") {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect current password." });
    }
    if (error.message === "NewPasswordSameAsOld") {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as the current password.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating password.",
    });
  }
};
