const User = require("../models/userModel");
const Message = require("../models/messageModel");

const socketIO = (io) => {
  const connectedUsers = new Map();

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("user_connected", async (userId) => {
      try {
        await User.findByIdAndUpdate(userId, { online: true });
        connectedUsers.set(userId, socket.id);
        io.emit("user_status_change", { userId, status: "online" });
      } catch (error) {
        console.error("Error marking user online:", error);
      }
    });

    socket.on("disconnect", async () => {
      try {
        const userId = [...connectedUsers.entries()].find(
          ([_, socketId]) => socketId === socket.id
        )?.[0];

        if (userId) {
          await User.findByIdAndUpdate(userId, { online: false });
          connectedUsers.delete(userId);
          io.emit("user_status_change", { userId, status: "offline" });
        }
      } catch (error) {
        console.error("Error marking user offline:", error);
      }
      console.log("Client disconnected:", socket.id);
    });

    socket.on("send_message", async ({ senderId, recipientId, message }) => {
      try {
        const newMessage = new Message({
          sender: senderId,
          recipient: recipientId,
          message: message,
        });
        await newMessage.save();

        const recipientSocketId = connectedUsers.get(recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("receive_message", newMessage);
          newMessage.status = "delivered";
          await newMessage.save();
        }

        socket.emit("message_sent", newMessage);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    socket.on("message_read", async ({ messageId, userId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { status: "read" });
        const senderSocketId = connectedUsers.get(userId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("message_status_update", {
            messageId,
            status: "read",
          });
        }
      } catch (error) {
        console.error("Error updating message status:", error);
      }
    });
  });
};

module.exports = socketIO;
