const getRequiredEnv = (name) => {
  const value = process.env[name];

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is not configured`);
  }

  return value.trim();
};

const validateEnv = () => {
  [
    "MONGO_URI",
    "JWT_SECRET",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ].forEach(getRequiredEnv);

  if (process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS !== undefined) {
    const timeout = Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS);

    if (!Number.isInteger(timeout) || timeout < 1) {
      throw new Error("MONGO_SERVER_SELECTION_TIMEOUT_MS must be a positive integer");
    }
  }
};

module.exports = {
  getRequiredEnv,
  validateEnv,
};
