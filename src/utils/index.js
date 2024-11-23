const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
var jwt = require("jsonwebtoken");

function generateVoucherToken() {
  return crypto.randomBytes(32).toString("hex"); // Generates a 64-character token
}

function createFolders(folderName) {
  // Define paths for images' and 'menus' directories starting from the project root
  const imagesDir = path.resolve(__dirname, "../images");
  const menusDir = path.resolve(imagesDir, folderName);
  // Ensure 'images' and 'menus' directories exist under 'src'
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  if (!fs.existsSync(menusDir)) {
    fs.mkdirSync(menusDir, { recursive: true });
  }
}

function deleteImage(folderName, fileName) {
  // Define the full path of the image
  const imagePath = path.resolve(__dirname, "../images", folderName, fileName);

  // Check if the file exists and delete it
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath); // Delete the file
    console.log(`Image ${fileName} deleted successfully from ${folderName}`);
    return true;
  } else {
    console.log(`Image ${fileName} not found in ${folderName}`);
    return false;
  }
}

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
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

module.exports = {
  createFolders,
  deleteImage,
  generateVoucherToken,
  verifyToken,
};
