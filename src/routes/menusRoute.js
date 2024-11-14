const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const path = require("path");
const fs = require("fs");

const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(
      null,
      "/Users/hlyanhtet/Desktop/personal_projects/hotpot_buffet_prisma/src/images/menus"
    );
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// *** create a new menu route ***
router.post("/", upload.single("menuPhoto"), async (req, res) => {
  try {
    const { menuName, menuDescription } = req.body;
    const menuPhoto = req.file ? req.file.filename : null;
    // Insert menu data into the database
    const newMenu = await prisma.menu.create({
      data: {
        menuName,
        menuPhoto,
        menuDescription,
      },
    });
    res.status(201).json({
      message: "Menu created successfully!",
      menu: newMenu,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error creating menu", details: error.message });
  }
});

// *** get all menus ***
router.get("/", async (req, res) => {
  try {
    const allMenus = await prisma.menu.findMany();
    res.status(201).json({
      message: "All Menus fetched successfully!",
      data: allMenus,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching menus", details: error.message });
  }
});

module.exports = router;
