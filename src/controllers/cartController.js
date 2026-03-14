const Cart = require("../models/Cart");
const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");

const populateCart = (query) =>
  query.populate("items.product", "productName productPrice productImage stock");
const parseQuantity = (value) => (value === undefined ? 1 : Number(value));

const getMyCart = asyncHandler(async (req, res) => {
  let cart = await populateCart(Cart.findOne({ user: req.user._id }));

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  res.json({ cart });
});

const addProductToCart = asyncHandler(async (req, res) => {
  const quantity = parseQuantity(req.body.quantity);

  if (!Number.isInteger(quantity) || quantity < 1) {
    res.status(400);
    throw new Error("quantity must be a positive integer");
  }

  const product = await Product.findById(req.params.productId);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const existingItem = cart.items.find(
    (item) => item.product.toString() === req.params.productId
  );

  const requestedQuantity = existingItem ? existingItem.quantity + quantity : quantity;

  if (requestedQuantity > product.stock) {
    res.status(400);
    throw new Error("Requested quantity exceeds available stock");
  }

  if (existingItem) {
    existingItem.quantity = requestedQuantity;
  } else {
    cart.items.push({
      product: product._id,
      quantity,
    });
  }

  await cart.save();
  await cart.populate("items.product", "productName productPrice productImage stock");

  res.status(201).json({
    message: "Product added to cart",
    cart,
  });
});

const increaseCartQuantity = asyncHandler(async (req, res) => {
  const quantity = parseQuantity(req.body.quantity);

  if (!Number.isInteger(quantity) || quantity < 1) {
    res.status(400);
    throw new Error("quantity must be a positive integer");
  }

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }

  const item = cart.items.find((cartItem) => cartItem.product.toString() === req.params.productId);

  if (!item) {
    res.status(404);
    throw new Error("Product not found in cart");
  }

  const product = await Product.findById(req.params.productId);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (item.quantity + quantity > product.stock) {
    res.status(400);
    throw new Error("Requested quantity exceeds available stock");
  }

  item.quantity += quantity;
  await cart.save();
  await cart.populate("items.product", "productName productPrice productImage stock");

  res.json({
    message: "Cart quantity updated",
    cart,
  });
});

const removeItemFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }

  const existingItem = cart.items.some(
    (item) => item.product.toString() === req.params.productId
  );

  if (!existingItem) {
    res.status(404);
    throw new Error("Product not found in cart");
  }

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== req.params.productId
  );

  await cart.save();
  await cart.populate("items.product", "productName productPrice productImage stock");

  res.json({
    message: "Item removed from cart",
    cart,
  });
});

module.exports = {
  getMyCart,
  addProductToCart,
  increaseCartQuantity,
  removeItemFromCart,
};
