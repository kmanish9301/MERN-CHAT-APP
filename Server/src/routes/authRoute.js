const express = require("express");
const {
  UserRegister,
  login,
  logout,
  refreshToken,
} = require("../controllers/authController");
const { authMiddleware } = require("../middlewares/middleware");

const router = express.Router();

router.post("/register", UserRegister);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.post("/refresh-token", refreshToken);

module.exports = router;
