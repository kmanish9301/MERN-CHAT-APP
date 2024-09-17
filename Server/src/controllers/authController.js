const User = require("../models/userModel");
const jwtHelper = require("../helpers/helper");
const bcrypt = require("bcrypt");

const UserRegister = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: true, message: "User already exists..!" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // Generate access token and refresh token
    const accessToken = jwtHelper.signToken(user._id);
    const refreshToken = jwtHelper.signRefreshToken(user._id);

    // Store the access token in an httpOnly cookie
    res.cookie("sessionToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
    });

    // Store the refresh token in MongoDB
    await jwtHelper.storeRefreshToken(user._id, refreshToken);

    // Send response with user details
    res.status(201).json({
      message: "User registered successfully",
      userId: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Registration failed", error: true });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate access token and refresh token
    const accessToken = jwtHelper.signToken(user._id);
    const refreshToken = jwtHelper.signRefreshToken(user._id);

    // Store the access token in an httpOnly cookie
    res.cookie("sessionToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
    });

    // Store the refresh token in MongoDB
    await jwtHelper.storeRefreshToken(user._id, refreshToken);

    // Send response with user details
    res.status(200).json({
      accessToken: accessToken,
      message: "Login successful",
      userId: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Login failed", error });
  }
};

const logout = async (req, res) => {
  try {
    const userId = req.userId; // Assuming userId is stored in the request
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    res.clearCookie("sessionToken");
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed", error });
  }
};

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(403).json({ message: "Refresh token not found." });
    }

    const userId = req.userId; // Assuming userId is stored in the request
    const storedToken = await User.findById(userId).select("refreshToken");
    if (!storedToken || storedToken.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token." });
    }

    // Generate new access token
    const newAccessToken = jwtHelper.signToken(userId);

    // Send the new access token in an httpOnly cookie
    res.cookie("sessionToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({
      accessToken: newAccessToken,
      message: "Token refreshed successfully.",
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({ message: "Failed to refresh token." });
  }
};

module.exports = {
  UserRegister,
  login,
  logout,
  refreshToken,
};
