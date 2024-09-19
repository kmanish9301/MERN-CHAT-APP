const express = require("express");
const router = express.Router();
const messageController = require("../controllers/chatController");
const { authMiddleware } = require("../middlewares/middleware");

router.post(
  "/send_message",
  // authMiddleware,
  messageController.sendMessage
);
router.get(
  "/conversation",
  // authMiddleware,
  messageController.getConversation
);
router.put(
  "/status",
  // authMiddleware,
  messageController.updateMessageStatus
);

module.exports = router;
