const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");

// Create a new package
router.post("/", async (req, res) => {
  const { packageName, packagePrice } = req.body;
  try {
    const newPackage = await prisma.package.create({
      data: {
        packageName,
        packagePrice,
      },
    });
    res.status(201).json({
      message: "Package created successfully!",
      menu: newPackage,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error creating package", details: error.message });
  }
});

// add menu into package
router.post("/createPackageMenu", async (req, res) => {
  const { packageId, menuId } = req.body;

  try {
    let newPackage;
    // Start a transaction
    await prisma.$transaction(async (prisma) => {
      newPackage = await prisma.packageMenu.create({
        data: {
          packageId,
          menuId,
        },
      });
    });
    res
      .status(201)
      .json({ message: "Transaction succeeded!", packageMenu: newPackage });
  } catch (error) {
    console.error("Transaction failed, rolling back changes:", error);
    res.status(500).json({ message: "Transaction failed, rolled back." });
  }
});

// *** get package detail with id ***
router.get("/detail", async (req, res) => {
  const id = parseInt(req.query.id);

  try {
    const packageWithMenus = await prisma.package.findUnique({
      where: {
        id: id,
      },
      include: {
        PackageMenu: {
          include: {
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

// *** get all packages ***
router.get("/", async (req, res) => {
  try {
    const allPackages = await prisma.package.findMany();
    res.status(201).json({
      message: "All Packages fetched successfully!",
      data: allPackages,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching packages", details: error.message });
  }
});

module.exports = router;
