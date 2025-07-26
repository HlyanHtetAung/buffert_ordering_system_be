const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");

// // Create a new package
// router.post("/", async (req, res) => {
//   const { packageName, packagePrice } = req.body;
//   try {
//     const newPackage = await prisma.package.create({
//       data: {
//         packageName,
//         packagePrice,
//       },
//     });
//     res.status(200).json({
//       message: "Package created successfully!",
//       data: newPackage,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: "Error creating package", details: error.message });
//   }
// });

// // add menu into package
// router.post("/createPackageMenu", async (req, res) => {
//  const { packageId, menuIds } = req.body;
//   try {
//     const createOperations = menuIds.map((menuId) =>
//       prisma.packageMenu.create({
//         data: {
//           packageId,
//           menuId,
//         },
//       })
//     );

//     const createdRecords = await prisma.$transaction(createOperations);

//     res.status(200).json({
//       message: "Transaction succeeded!",
//       data: createdRecords,
//     });
//   } catch (error) {
//     console.error("Transaction failed, rolling back changes:", error);
//     res.status(500).json({ message: "Transaction failed, rolled back." });
//   }
// });

// *** create package and add menus into that created package ***
router.post("/", async (req, res) => {
  const { packageName, packagePrice, menuIds } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Validate menu IDs
      const validMenus = await tx.menu.findMany({
        where: {
          id: {
            in: menuIds,
          },
        },
      });

      const validMenuIds = validMenus.map((menu) => menu.id);

      if (validMenuIds.length === 0) {
        throw new Error("No valid menuIds found in the database.");
      }

      // Create the package
      const newPackage = await tx.package.create({
        data: {
          packageName,
          packagePrice,
        },
      });

      // Create packageMenu entries for valid menus
      await Promise.all(
        validMenuIds.map((menuId) =>
          tx.packageMenu.create({
            data: {
              packageId: newPackage.id,
              menuId,
            },
          })
        )
      );

      // Return full menu data only
      const menus = validMenus;

      return {
        package: newPackage,
        menus,
      };
    });

    res.status(200).json({
      message: "Package and valid menus created successfully!",
      data: result,
    });
  } catch (error) {
    console.error("Transaction failed:", error);
    res.status(500).json({
      error: "Transaction failed",
      details: error.message,
    });
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
