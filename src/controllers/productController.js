const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Wishlist = require("../models/Wishlist");
const asyncHandler = require("../middleware/asyncHandler");
const { uploadImage, removeImage } = require("../utils/uploadToCloudinary");

const normalizeText = (value) => String(value ?? "").trim();
const buildProductResponse = (product, wishlistProductIds = new Set()) => {
  const safeProduct = product.toObject();
  safeProduct.inWishlist = wishlistProductIds.has(product._id.toString());
  return safeProduct;
};
const getWishlistProductIds = async (userId) => {
  if (!userId) {
    return new Set();
  }

  const wishlist = await Wishlist.findOne({ user: userId }).select("products");
  return new Set((wishlist?.products || []).map((productId) => productId.toString()));
};

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

const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  const wishlistProductIds = await getWishlistProductIds(req.user?._id);

  res.json({
    count: products.length,
    products: products.map((product) => buildProductResponse(product, wishlistProductIds)),
  });
});

const getSingleProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const wishlistProductIds = await getWishlistProductIds(req.user?._id);

  res.json({
    product: buildProductResponse(product, wishlistProductIds),
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const updates = {};

  if (req.body.productName !== undefined) {
    const productName = normalizeText(req.body.productName);

    if (!productName) {
      res.status(400);
      throw new Error("productName cannot be empty");
    }

    updates.productName = productName;
  }

  if (req.body.productPrice !== undefined) {
    const productPrice = Number(req.body.productPrice);

    if (!Number.isFinite(productPrice) || productPrice <= 0) {
      res.status(400);
      throw new Error("productPrice must be greater than 0");
    }

    updates.productPrice = productPrice;
  }

  if (req.body.stock !== undefined) {
    const stock = Number(req.body.stock);

    if (!Number.isInteger(stock) || stock < 0) {
      res.status(400);
      throw new Error("stock must be a non-negative integer");
    }

    updates.stock = stock;
  }

  if (req.body.productDescription !== undefined) {
    const productDescription = normalizeText(req.body.productDescription);

    if (!productDescription) {
      res.status(400);
      throw new Error("productDescription cannot be empty");
    }

    updates.productDescription = productDescription;
  }

  if (!req.file && Object.keys(updates).length === 0) {
    res.status(400);
    throw new Error("Provide at least one field or productImage to update");
  }

  let newImage;
  const oldImagePublicId = product.productImage.publicId;

  if (req.file) {
    newImage = await uploadImage(req.file);
    updates.productImage = newImage;
  }

  try {
    Object.assign(product, updates);
    await product.save();
  } catch (error) {
    if (newImage) {
      await removeImage(newImage.publicId);
    }

    throw error;
  }

  if (newImage) {
    await removeImage(oldImagePublicId);
  }

  res.json({
    message: "Product updated successfully",
    product,
  });
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
  updateProduct,
  deleteProduct,
};
