// src/app.js
const express = require("express");
const app = express();
const cors = require("cors");
const { FOLDER_LIST_TO_UPLOAD_FILES } = require("./constants");
const { createFolders } = require("./utils");
var jwt = require("jsonwebtoken");

// app.use(cors());
app.use(express.json()); // Middleware to parse JSON request bodies

// *** all routes ***
const userRoutes = require("./routes/usersRoute");
const authRoutes = require("./routes/authRoute");
const menusRoutes = require("./routes/menusRoute");
const packageRoutes = require("./routes/packageRoute");

// middleware to detect token is still valid or not
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, "accessTokenPrivateKey");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

app.use("/", authRoutes);

// *** Protected route ***
app.use(verifyToken);

// *** admin routes ***
app.use("/users", userRoutes); // All user-related routes
app.use("/menus", menusRoutes); // All menu-related routes
app.use("/package", packageRoutes); // All package-related routes

// ** this is for to create folder to upload files
FOLDER_LIST_TO_UPLOAD_FILES.forEach((folderName) => createFolders(folderName));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
