const prisma = require("../utils/prisma");
const bcrypt = require("bcrypt");

exports.registerUser = async (name, email, password) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      email: true,
    },
  });
  if (existingUser) {
    throw new Error("EmailAlreadyInUse");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
  };
};

exports.login = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    throw new Error("InvalidCredentials");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("InvalidCredentials");
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

exports.loginAdmin = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      password: true,
    },
  });
  if (!user || user.role !== "ADMIN") {
    throw new Error("AuthorizationFailed");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("AuthorizationFailed");
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
};
