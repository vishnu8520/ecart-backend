const express = require("express");

const {
  registerUser,
  loginUser,
  getCurrentUser,
  getCustomerUsers,
} = require("../controllers/authController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getCurrentUser);
router.get("/users", protect, adminOnly, getCustomerUsers);

module.exports = router;
