const express = require("express");

const {
  getMyCart,
  addProductToCart,
  increaseCartQuantity,
  decreaseCartQuantity,
  removeItemFromCart,
} = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getMyCart);
router.post("/:productId", addProductToCart);
router.patch("/:productId/increase", increaseCartQuantity);
router.patch("/:productId/decrease", decreaseCartQuantity);
router.delete("/:productId", removeItemFromCart);

module.exports = router;
