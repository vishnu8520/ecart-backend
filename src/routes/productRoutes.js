const express = require("express");

const {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { protect, optionalProtect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router
  .route("/")
  .get(optionalProtect, getAllProducts)
  .post(protect, adminOnly, upload.single("productImage"), createProduct);
router
  .route("/:productId")
  .get(optionalProtect, getSingleProduct)
  .patch(protect, adminOnly, upload.single("productImage"), updateProduct)
  .delete(protect, adminOnly, deleteProduct);

module.exports = router;
