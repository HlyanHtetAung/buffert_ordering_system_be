const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const path = require("path");
const fs = require("fs");

const multer = require("multer");
const { deleteImage } = require("../utils");

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
      data: newMenu,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error creating menu", details: error.message });
  }
});

// *** edit menu ***
router.patch("/edit", upload.single("menuPhoto"), async (req, res) => {
  try {
    const id = parseInt(req.query.id);
    const { menuName, menuDescription } = req.body;
    const menuPhoto = req.file ? req.file.filename : undefined;

    // Find the current menu data in the database
    const existingMenu = await prisma.menu.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingMenu) {
      return res.status(404).json({ error: "Menu not found" });
    }

    // delete the photo if menuPhoto is provided
    if (menuPhoto && existingMenu.menuPhoto) {
      deleteImage("menus", existingMenu.menuPhoto);
    }

    // ** to update data dynamically **
    const updateData = {
      ...(menuName && { menuName }),
      ...(menuDescription && { menuDescription }),
      ...(menuPhoto && { menuPhoto }),
    };

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    const updatedMenu = await prisma.menu.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      message: "Menu updated successfully!",
      data: updatedMenu,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error updating menu", details: error.message });
  }
});

// *** get menu detail with id ***
router.get("/detail", async (req, res) => {
  const id = parseInt(req.query.id);

  try {
    const menu = await prisma.menu.findUnique({
      where: {
        id: id,
      },
    });

    res.status(201).json({
      message: "Menu detail fetched successfully!",
      data: menu,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching menu", details: error.message });
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
