const jwt = require("jsonwebtoken");

const generateToken = (id, userType) =>
  jwt.sign({ id, userType }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

module.exports = generateToken;
