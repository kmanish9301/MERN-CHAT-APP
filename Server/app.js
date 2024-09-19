const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const socketIo = require("socket.io");
const cookieParser = require("cookie-parser");

const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoute");
const chatRoutes = require("./src/routes/chatRoutes");
const socketIO = require("./src/chatSocket/chatSocket");

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());

app.use("/v1/", authRoutes);
app.use("/v1/", chatRoutes);

socketIO(io);

connectDB(app);
