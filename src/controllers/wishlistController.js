const Product = require("../models/Product");
const Wishlist = require("../models/Wishlist");
const asyncHandler = require("../middleware/asyncHandler");

const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate(
    "products",
    "productName productPrice productImage stock"
  );

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  res.json({ wishlist });
});

const addToWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  const alreadyAdded = wishlist.products.some(
    (productId) => productId.toString() === req.params.productId
  );

  if (!alreadyAdded) {
    wishlist.products.push(product._id);
    await wishlist.save();
  }

  await wishlist.populate("products", "productName productPrice productImage stock");

  res.status(201).json({
    message: alreadyAdded ? "Product already in wishlist" : "Product added to wishlist",
    wishlist,
  });
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });

  if (!wishlist) {
    res.status(404);
    throw new Error("Wishlist not found");
  }

  const existingProduct = wishlist.products.some(
    (productId) => productId.toString() === req.params.productId
  );

  if (!existingProduct) {
    res.status(404);
    throw new Error("Product not found in wishlist");
  }

  wishlist.products = wishlist.products.filter(
    (productId) => productId.toString() !== req.params.productId
  );

  await wishlist.save();
  await wishlist.populate("products", "productName productPrice productImage stock");

  res.json({
    message: "Product removed from wishlist",
    wishlist,
  });
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
