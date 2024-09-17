const express = require("express");
const {
  UserRegister,
  login,
  logout,
  refreshToken,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", UserRegister);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);

module.exports = router;
