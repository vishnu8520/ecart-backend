const jwt = require("jsonwebtoken");

const User = require("../models/User");
const asyncHandler = require("./asyncHandler");

const getUserFromToken = async (token) => {
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Not authorized, invalid token");
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new Error("Not authorized, user not found");
  }

  return user;
};

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized, token missing");
  }

  const token = authHeader.split(" ")[1];
  req.user = await getUserFromToken(token);
  next();
});

const optionalProtect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  if (!authHeader.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized, invalid token");
  }

  const token = authHeader.split(" ")[1];
  req.user = await getUserFromToken(token);
  next();
});

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.userType !== "admin") {
    res.status(403);
    throw new Error("Admin access required");
  }

  next();
};

module.exports = {
  protect,
  optionalProtect,
  adminOnly,
};
