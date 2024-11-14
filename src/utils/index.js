const path = require("path");
const fs = require("fs");

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

module.exports = { createFolders };
