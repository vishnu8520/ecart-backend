const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");

const CART_PRODUCT_FIELDS = "productName productPrice productImage stock";

const createOrder = asyncHandler(async (req, res) => {
  const session = await Order.startSession();
  let order;

  try {
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ user: req.user._id })
        .session(session)
        .populate("items.product", CART_PRODUCT_FIELDS);

      if (!cart || cart.items.length === 0) {
        res.status(400);
        throw new Error("Cart is empty");
      }

      for (const item of cart.items) {
        if (!item.product) {
          res.status(400);
          throw new Error("One or more cart items are no longer available");
        }

        if (item.quantity > item.product.stock) {
          res.status(400);
          throw new Error(`Insufficient stock for ${item.product.productName}`);
        }
      }

      const items = cart.items.map((item) => ({
        product: item.product._id,
        productName: item.product.productName,
        productPrice: item.product.productPrice,
        imageUrl: item.product.productImage.url,
        quantity: item.quantity,
      }));

      const totalAmount = items.reduce(
        (sum, item) => sum + item.productPrice * item.quantity,
        0
      );

      for (const item of cart.items) {
        const updatedProduct = await Product.updateOne(
          { _id: item.product._id, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session }
        );

        if (updatedProduct.modifiedCount !== 1) {
          res.status(400);
          throw new Error(`Insufficient stock for ${item.product.productName}`);
        }
      }

      order = new Order({
        user: req.user._id,
        items,
        totalAmount,
      });

      await order.save({ session });

      cart.items = [];
      await cart.save({ session });
    });
  } finally {
    await session.endSession();
  }

  res.status(201).json({
    message: "Order created successfully",
    order,
  });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

  res.json({
    count: orders.length,
    orders,
  });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.user.toString() !== req.user._id.toString() && req.user.userType !== "admin") {
    res.status(403);
    throw new Error("Not authorized to view this order");
  }

  res.json({ order });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
};
