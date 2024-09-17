const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = (app) => {
  const PORT = process.env.PORT || 8000;
  const URL =
    process.env.MONGODB_URL || "mongodb://localhost:27017/mern_chat_app";

  mongoose
    .connect(URL)
    .then(() => {
      console.log("DB connected successfully!");
      app.listen(PORT, () => {
        console.log(`Server is running on the port: http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Error connecting to the database:", err);
      process.exit(1);
    });
};

module.exports = connectDB;
