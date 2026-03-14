const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Wishlist = require("../models/Wishlist");
const asyncHandler = require("../middleware/asyncHandler");
const { uploadImage, removeImage } = require("../utils/uploadToCloudinary");

const normalizeText = (value) => String(value ?? "").trim();

const createProduct = asyncHandler(async (req, res) => {
  const { productName, productPrice, stock, productDescription } = req.body;
  const normalizedProductName = normalizeText(productName);
  const normalizedProductDescription = normalizeText(productDescription);

  if (
    !normalizedProductName ||
    productPrice === undefined ||
    stock === undefined ||
    !normalizedProductDescription
  ) {
    res.status(400);
    throw new Error(
      "productName, productPrice, stock and productDescription are required"
    );
  }

  if (!req.file) {
    res.status(400);
    throw new Error("productImage is required");
  }

  const parsedPrice = Number(productPrice);
  const parsedStock = Number(stock);

  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    res.status(400);
    throw new Error("productPrice must be greater than 0");
  }

  if (!Number.isInteger(parsedStock) || parsedStock < 0) {
    res.status(400);
    throw new Error("stock must be a non-negative integer");
  }

  const image = await uploadImage(req.file);

  const product = await Product.create({
    productName: normalizedProductName,
    productPrice: parsedPrice,
    stock: parsedStock,
    productDescription: normalizedProductDescription,
    productImage: image,
    createdBy: req.user._id,
  });

  res.status(201).json({
    message: "Product created successfully",
    product,
  });
});

const getAllProducts = asyncHandler(async (_req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });

  res.json({
    count: products.length,
    products,
  });
});

const getSingleProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json({ product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  await Promise.all([
    removeImage(product.productImage.publicId),
    Cart.updateMany({}, { $pull: { items: { product: product._id } } }),
    Wishlist.updateMany({}, { $pull: { products: product._id } }),
    product.deleteOne(),
  ]);

  res.json({
    message: "Product deleted successfully",
  });
});

module.exports = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  deleteProduct,
};
