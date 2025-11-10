const prisma = require("../utils/prisma");
const bcrypt = require("bcrypt");

exports.getUsers = async () => {
  return prisma.user.findMany();
};

exports.totalUsers = async () => {
  return prisma.user.count();
};

exports.updateUserById = async (userId, dataToUpdate) => {
  return prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      DOB: true,
      gender: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
      role: true,
    },
  });
};

exports.changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      password: true,
    },
  });
  if (!user) {
    throw new Error("UserNotFound");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new Error("IncorrectCurrentPassword");
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new Error("NewPasswordSameAsOld");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};
