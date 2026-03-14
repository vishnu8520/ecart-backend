const express = require("express");

const {
  createOrder,
  getMyOrders,
  getOrderById,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/").post(createOrder).get(getMyOrders);
router.get("/my", getMyOrders);
router.get("/:orderId", getOrderById);

module.exports = router;
