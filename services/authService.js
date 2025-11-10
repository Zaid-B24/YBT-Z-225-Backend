const prisma = require("../utils/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//Add Zod validation

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

  const token = jwt.sign(
    { id: newUser.id, role: newUser.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: { id: newUser.id, name: newUser.name, email: newUser.email },
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
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email },
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
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: { id: user.id, email: user.email, role: user.role },
  };
};
