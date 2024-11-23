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

// *** create a new menu ***
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

// *** edit menu ***
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.$transaction(async (prisma) => {
      const deletedMenuRecords = await prisma.packageMenu.deleteMany({
        where: {
          menuId: parseInt(id, 10),
        },
      });
      console.log("Deleted menu records", deletedMenuRecords);
      // Find the current menu data in the database
      const existingMenu = await prisma.menu.findUnique({
        where: { id: parseInt(id, 10) },
      });

      if (!existingMenu) {
        return res.status(404).json({ error: "Menu not found" });
      }

      // delete the existing photo
      if (existingMenu.menuPhoto) {
        deleteImage("menus", existingMenu.menuPhoto);
      }

      const deletedMenu = await prisma.menu.delete({
        where: { id: parseInt(id, 10) },
      });

      res.status(200).json({
        message: "Menu deleted successfully!",
        data: deletedMenu,
      });
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error deleting menu", details: error.message });
  }
});

// ** order accessible menus by client **
router.get("/client/:token", async (req, res) => {
  const { token } = req.params;
  try {
    // ** search voucher by token and check is it still active or not **
    const voucher = await prisma.voucher.findUnique({
      where: {
        token,
      },
    });
    if (!voucher) {
      return res.status(404).json({ error: "Voucher is not found" });
    }
    if (voucher.isActive == false) {
      return res
        .status(404)
        .json({ error: "Voucher is not accessible anymore!" });
    }

    const packageId = voucher.packageId;
    const packageWithMenus = await prisma.package.findUnique({
      where: {
        id: packageId,
      },
      include: {
        PackageMenu: {
          select: {
            id: true,
            menu: true,
          },
        },
      },
    });
    const formattedResponse = {
      package: {
        id: packageWithMenus.id,
        packageName: packageWithMenus.packageName,
        packagePrice: packageWithMenus.packagePrice,
      },
      menus: packageWithMenus.PackageMenu.map((pkgMenu) => ({
        pkMenuId: pkgMenu.id,
        id: pkgMenu.menu.id,
        menuName: pkgMenu.menu.menuName,
        menuPhoto: pkgMenu.menu.menuPhoto,
        menuDescription: pkgMenu.menu.menuDescription,
      })),
    };

    res.status(201).json({
      message: "Package detail fetched successfully!",
      data: formattedResponse,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching package", details: error.message });
  }
});

// ** order accessible menus by client **
router.post("/client/orderMenu/:token", async (req, res) => {
  const { token } = req.params;
  const { menuId } = req.body;
  console.log("Token", token);
  console.log("menu id", menuId);

  try {
    // ** search voucher by token and check is it still active or not **
    const voucher = await prisma.voucher.findUnique({
      where: {
        token,
      },
    });
    if (!voucher) {
      return res.status(404).json({ error: "Voucher is not found" });
    }
    if (voucher.isActive == false) {
      return res
        .status(404)
        .json({ error: "Voucher is not accessible anymore!" });
    }
    const createdOrder = await prisma.voucherMenu.create({
      data: {
        voucherId: parseInt(voucher.id, 10),
        menuId: parseInt(menuId, 10),
      },
    });
    res.status(201).json({
      message: "Order created successfully!",
      data: createdOrder,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error creating order", details: error.message });
  }
});

// ** get ordered Menus group by tableId ***
router.get("/orderedMenus", async (req, res) => {
  try {
    const groupedMenus = await prisma.voucherMenu.findMany({
      where: {
        isDone: false,
        voucher: {
          isActive: true, // Ensure only active vouchers are considered
        },
      },
      include: {
        voucher: {
          include: {
            table: true, // Include table details for grouping
          },
        },
        menu: true, // Include menu details
      },
      orderBy: [
        {
          voucher: {
            tableId: "asc", // Order by table ID
          },
        },
        {
          id: "asc", // Order by VoucherMenu ID within the table group
        },
      ],
    });

    const groupedList = Object.values(
      groupedMenus.reduce((acc, item) => {
        const tableId = item.voucher.table.id;

        // If the table ID doesn't exist in the accumulator, initialize it
        if (!acc[tableId]) {
          acc[tableId] = {
            tableId,
            menus: [], // Initialize an array to hold menu items
          };
        }

        // Add the current item to the menus array
        acc[tableId].menus.push(item);

        return acc;
      }, {})
    );

    res.status(201).json({
      message: "Active vouchers",
      data: groupedList,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error fetching active vouchers",
      details: error.message,
    });
  }
});

module.exports = router;
