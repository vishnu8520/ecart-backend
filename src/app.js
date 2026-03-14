const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const orderRoutes = require("./routes/orderRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

const normalizeOrigin = (origin) => origin.replace(/\/+$/, "");

const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
      .map((origin) => normalizeOrigin(origin.trim()))
      .filter(Boolean)
  : [];
const corsOptions =
  configuredOrigins.length > 0
    ? {
        origin(origin, callback) {
          if (!origin) {
            callback(null, true);
            return;
          }

          const normalizedOrigin = normalizeOrigin(origin);

          if (configuredOrigins.includes(normalizedOrigin)) {
            callback(null, true);
            return;
          }

          callback(new Error(`CORS origin not allowed: ${origin}`));
        },
        credentials: true,
      }
    : {
        origin: true,
        credentials: true,
      };

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.json({ message: "Backend API is running" });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
