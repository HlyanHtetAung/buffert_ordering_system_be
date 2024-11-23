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
    res.status(200).json({
      message: "Package created successfully!",
      data: newPackage,
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
      .status(200)
      .json({ message: "Transaction succeeded!", data: newPackage });
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

    res.status(200).json({
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
    res.status(200).json({
      message: "All Packages fetched successfully!",
      data: allPackages,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching packages", details: error.message });
  }
});

// *** remove menu from pacakge ***
router.delete("/removeMenu/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedPackageMenu = await prisma.packageMenu.delete({
      where: {
        id: parseInt(id, 10),
      },
    });

    res.status(200).json({
      message: "PackageMenu deleted successfully!",
      data: deletedPackageMenu,
    });
  } catch (error) {
    if (error.code === "P2025") {
      // Handle case where record does not exist
      res.status(404).json({ error: "PackageMenu not found" });
    } else {
      // Handle other errors
      res.status(500).json({
        error: "An error occurred while deleting the PackageMenu",
        details: error.message,
      });
    }
  }
});

module.exports = router;
