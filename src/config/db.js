const mongoose = require("mongoose");
const { getRequiredEnv } = require("./env");

const connectDB = async () => {
  const mongoUri = getRequiredEnv("MONGO_URI");
  const serverSelectionTimeoutMS = process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS
    ? Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS)
    : 10000;
  const connection = await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS,
  });

  console.log(`MongoDB connected: ${connection.connection.host}`);
};

module.exports = connectDB;
