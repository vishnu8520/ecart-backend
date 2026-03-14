const express = require("express");

const {
  createProduct,
  getAllProducts,
  getSingleProduct,
  deleteProduct,
} = require("../controllers/productController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.route("/").get(getAllProducts).post(protect, adminOnly, upload.single("productImage"), createProduct);
router.route("/:productId").get(getSingleProduct).delete(protect, adminOnly, deleteProduct);

module.exports = router;
