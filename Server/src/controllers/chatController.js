const Message = require("../models/messageModel");
const User = require("../models/userModel");

const sendMessage = async (req, res) => {
  try {
    const { sender, recipient, message } = req.body;

    if (!sender || !recipient || !message) {
      return res
        .status(400)
        .json({ message: "Sender, recipient, and message are required." });
    }

    const newMessage = new Message({
      sender,
      recipient,
      message,
    });

    await newMessage.save();

    // Emit the new message to both sender and recipient
    const io = req.app.get("io");
    io.to(sender).to(recipient).emit("new_message", newMessage);

    res.status(201).json({ message: "Message sent successfully", newMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message", error });
  }
};

const getConversation = async (req, res) => {
  try {
    const { userId } = req.user;
    const { recipientId } = req.query;

    if (!recipientId) {
      return res.status(400).json({ message: "Recipient ID is required." });
    }

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: recipientId },
        { sender: recipientId, recipient: userId },
      ],
    }).sort({ timestamp: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error retrieving conversation:", error);
    res.status(500).json({ message: "Failed to retrieve conversation", error });
  }
};

const updateMessageStatus = async (req, res) => {
  try {
    const { messageId, status } = req.body;

    if (!messageId || !status) {
      return res
        .status(400)
        .json({ message: "Message ID and status are required." });
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { status },
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({ message: "Message not found." });
    }

    // Emit the updated message status
    const io = req.app.get("io");
    io.to(updatedMessage.sender.toString()).emit("message_status_update", {
      messageId,
      status,
    });

    res
      .status(200)
      .json({ message: "Message status updated successfully", updatedMessage });
  } catch (error) {
    console.error("Error updating message status:", error);
    res.status(500).json({ message: "Failed to update message status", error });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  updateMessageStatus,
};
