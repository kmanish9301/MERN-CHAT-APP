const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// Sign access token with a 15-minute expiry
const signToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

// Sign refresh token with a longer expiry (7 days)
const signRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

// Verify access token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Verify refresh token
const verifyRefreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    return decoded.userId;
  } catch (error) {
    return null; // Token invalid or expired
  }
};

// Store refresh token in MongoDB
const storeRefreshToken = async (userId, refreshToken) => {
  try {
    await User.findByIdAndUpdate(userId, { refreshToken });
  } catch (error) {
    console.error("Error storing refresh token:", error);
  }
};

module.exports = {
  signToken,
  signRefreshToken,
  verifyToken,
  verifyRefreshToken,
  storeRefreshToken,
};
