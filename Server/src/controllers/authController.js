const User = require("../models/userModel");
const jwtHelper = require("../helpers/helper");
const bcrypt = require("bcrypt");

const UserRegister = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: true, message: "User already exists..!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const accessToken = jwtHelper.signToken(user._id);
    const refreshToken = jwtHelper.signRefreshToken(user._id);

    res.cookie("sessionToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
    });

    await jwtHelper.storeRefreshToken(user._id, refreshToken);

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

    const accessToken = jwtHelper.signToken(user._id);
    const refreshToken = jwtHelper.signRefreshToken(user._id);

    res.cookie("sessionToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
    });

    await jwtHelper.storeRefreshToken(user._id, refreshToken);

    // User is now considered online, but actual status update will be done when socket connects
    await User.findByIdAndUpdate(user._id, { online: true });

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
    const userId = req.userId;
    await User.findByIdAndUpdate(userId, { refreshToken: null, online: false });
    res.clearCookie("sessionToken");

    // The socket will handle the actual offline status update

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

    const userId = await jwtHelper.verifyRefreshToken(refreshToken);
    if (!userId) {
      return res.status(403).json({ message: "Invalid refresh token." });
    }

    const user = await User.findById(userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token." });
    }

    const newAccessToken = jwtHelper.signToken(userId);

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
