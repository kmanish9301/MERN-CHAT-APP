const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const signToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

const signRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const verifyRefreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    return decoded.userId;
  } catch (error) {
    return null;
  }
};

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
