// src/app.js
const express = require("express");
const app = express();
const cors = require("cors");
const { FOLDER_LIST_TO_UPLOAD_FILES } = require("./constants");
const { createFolders } = require("./utils");
const http = require("http");
const { Server } = require("socket.io");

// *** all routes ***
const userRoutes = require("./routes/usersRoute");
const authRoutes = require("./routes/authRoute");
const menusRoutes = require("./routes/menusRoute");
const packageRoutes = require("./routes/packageRoute");
const tableRoutes = require("./routes/tableRoute");
const voucherRoutes = require("./routes/voucherRoute");
const categoryRoutes = require("./routes/categoryRoute");

const socketConnections = require("./socketIo");

app.use(cors());
app.use(express.json()); // Middleware to parse JSON request bodies

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.REACT_APP_URL, // Replace with the React app's URL
    methods: ["GET", "POST"],
  },
});

socketConnections(io);

app.use("/", authRoutes);

// *** all routes ***
app.use("/users", userRoutes); // All user-related routes
app.use("/menus", menusRoutes(io)); // All menu-related routes
app.use("/package", packageRoutes); // All package-related routes
app.use("/table", tableRoutes(io)); // All table related routes
app.use("/voucher", voucherRoutes(io)); // All voucher related routes
app.use("/category", categoryRoutes); // All voucher related routes

// ** this is for to create folder to upload files
FOLDER_LIST_TO_UPLOAD_FILES.forEach((folderName) => createFolders(folderName));

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Socket Server running on port ${PORT}`);
});

// app.post("/socketRoute", (req, res) => {
//   const { message } = req.body;

//   if (!message) {
//     return res.status(400).json({ error: "Message is required" });
//   }

//   // Emit the message to all connected clients
//   io.emit("serverMessage", message);

//   res
//     .status(200)
//     .json({ success: true, message: "Message broadcasted to clients!" });
// });
