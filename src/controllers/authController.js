const User = require("../models/User");
const Cart = require("../models/Cart");
const Wishlist = require("../models/Wishlist");
const Order = require("../models/Order");
const generateToken = require("../utils/generateToken");
const asyncHandler = require("../middleware/asyncHandler");

const normalizeText = (value) => String(value ?? "").trim();

const buildUserResponse = (user) => {
  const safeUser = user.toObject();
  delete safeUser.password;
  return safeUser;
};

const registerUser = asyncHandler(async (req, res) => {
  const { userName, emailId, phoneNumber, password, userType } = req.body;
  const normalizedUserName = normalizeText(userName);
  const normalizedEmail = normalizeText(emailId).toLowerCase();
  const normalizedPhone = normalizeText(phoneNumber);
  const normalizedPassword = String(password ?? "");
  const normalizedUserType = normalizeText(userType).toLowerCase() || "customer";

  if (
    !normalizedUserName ||
    !normalizedEmail ||
    !normalizedPhone ||
    !normalizedPassword
  ) {
    res.status(400);
    throw new Error("userName, emailId, phoneNumber and password are required");
  }

  if (normalizedPassword.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters long");
  }

  const existingUser = await User.findOne({
    $or: [{ emailId: normalizedEmail }, { phoneNumber: normalizedPhone }],
  });

  if (existingUser) {
    res.status(400);
    throw new Error("User already exists with the provided email or phone number");
  }

  const user = await User.create({
    userName: normalizedUserName,
    emailId: normalizedEmail,
    phoneNumber: normalizedPhone,
    password: normalizedPassword,
    userType: normalizedUserType,
  });

  res.status(201).json({
    message: "User registered successfully",
    token: generateToken(user._id, user.userType),
    user: buildUserResponse(user),
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { emailOrPhone, emailId, phoneNumber, password } = req.body;
  const identifier = normalizeText(emailOrPhone || emailId || phoneNumber);
  const normalizedPassword = String(password ?? "");

  if (!identifier || !normalizedPassword) {
    res.status(400);
    throw new Error("Identifier and password are required");
  }

  const query = identifier.includes("@")
    ? { emailId: identifier.toLowerCase() }
    : {
        $or: [{ phoneNumber: identifier }, { emailId: identifier.toLowerCase() }],
      };

  const user = await User.findOne(query).select("+password");

  if (!user || !(await user.matchPassword(normalizedPassword))) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  res.json({
    message: "Login successful",
    token: generateToken(user._id, user.userType),
    user: buildUserResponse(user),
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({
    user: buildUserResponse(req.user),
  });
});

const getCustomerUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({ userType: "customer" }).sort({ createdAt: -1 });

  res.json({
    count: users.length,
    users: users.map(buildUserResponse),
  });
});

const deleteCustomerUser = asyncHandler(async (req, res) => {
  const session = await User.startSession();

  try {
    await session.withTransaction(async () => {
      const user = await User.findById(req.params.userId).session(session);

      if (!user) {
        res.status(404);
        throw new Error("User not found");
      }

      if (user.userType !== "customer") {
        res.status(400);
        throw new Error("Only customer accounts can be deleted");
      }

      await Promise.all([
        Cart.deleteOne({ user: user._id }, { session }),
        Wishlist.deleteOne({ user: user._id }, { session }),
        Order.deleteMany({ user: user._id }, { session }),
        user.deleteOne({ session }),
      ]);
    });
  } finally {
    await session.endSession();
  }

  res.json({
    message: "Customer deleted successfully",
  });
});

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  getCustomerUsers,
  deleteCustomerUser,
};
