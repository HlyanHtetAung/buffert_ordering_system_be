const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { deleteImage } = require("../utils");
const { uploadImageToS3, getImageFromS3 } = require("../s3");
const upload = multer({ dest: "uploads/" });

const adminRoutes = () => {
  // *** create a new menu ***
  router.post("/", upload.single("menuPhoto"), async (req, res) => {
    const file = req.file;
    try {
      const { menuName, menuDescription, categoryId, menuPrice } = req.body;
      const result = await uploadImageToS3(file);
      const awsImageResponse = await getImageFromS3(result.key);

      // Insert menu data into the database
      const newMenu = await prisma.menu.create({
        data: {
          menuName,
          menuPhoto: awsImageResponse,
          menuDescription,
          menuPrice: parseInt(menuPrice),
          categoryId: parseInt(categoryId),
        },
      });
      res.status(200).json({
        message: "Menu created successfully!",
        data: newMenu,
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error creating menu", details: error.message });
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
              TableVoucher: {
                where: {
                  isActive: true, // Include only active TableVoucher
                },
                select: {
                  tableId: true, // Select only the tableId
                },
              },
            },
          },
          menu: true, // Include menu details
        },
      });

      const groupedList = Object.values(
        groupedMenus.reduce((acc, item) => {
          const tableId = item.voucher.TableVoucher[0].tableId;
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

      res.status(200).json({
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

      res.status(200).json({
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
  const { categoryId } = req.query;

  try {
    const allMenus = await prisma.menu.findMany({
      where: categoryId ? { categoryId: parseInt(categoryId) } : {},
      include: {
        category: true,
      },
    });

    res.status(200).json({
      message: "All Menus fetched successfully!",
      data: allMenus,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error fetching menus",
      details: error.message,
    });
  }
});

  // *** delete menu ***
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
};

const clientRoutes = () => {
  // ** get all accessible menus by client **
  router.get("/client/:tableId", async (req, res) => {
    const { tableId } = req.params;
    try {
      if (!tableId) {
        return res.status(400).json({ error: "tableId is required" });
      }

      try {
        const tableVoucher = await prisma.tableVoucher.findFirst({
          where: {
            tableId: parseInt(tableId),
            isActive: true,
          },
        });

        if (!tableVoucher) {
          return res.status(404).json({
            error: "No active TableVoucher found for the given tableId",
          });
        }

        // ** search voucher by token and check is it still active or not **
        const voucher = await prisma.voucher.findUnique({
          where: {
            id: tableVoucher.voucherId,
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

        // Fetch the package with menus included
        const packageWithMenus = await prisma.package.findUnique({
          where: {
            id: packageId,
          },
          include: {
            PackageMenu: {
              select: {
                id: true,
                menuId: true,
                packageId: true,
                menu: {
                  select: {
                    id: true,
                    menuName: true,
                    menuPhoto: true,
                    menuDescription: true,
                    menuPrice: true,
                  },
                },
              },
            },
          },
        });

        // Fetch all menus
        const allMenus = await prisma.menu.findMany({
          select: {
            id: true,
            menuName: true,
            menuPhoto: true,
            menuDescription: true,
            menuPrice: true,
          },
        });

        // Map menus with package inclusion check
        const formattedResponse = {
          package: {
            id: packageWithMenus.id,
            packageName: packageWithMenus.packageName,
            packagePrice: packageWithMenus.packagePrice,
          },
          menus: allMenus.map((menu) => {
            // Check if the menu is part of the package
            const pkgMenu = packageWithMenus.PackageMenu.find(
              (pkgMenu) => pkgMenu.menuId === menu.id
            );

            return {
              id: menu.id,
              menuName: menu.menuName,
              menuPhoto: menu.menuPhoto,
              menuDescription: menu.menuDescription,
              menuPrice: pkgMenu ? 0 : menu.menuPrice,
              // if the menu is included in package return price 0 otherwise return actual menu price
            };
          }),
        };

        res.status(200).json({
          message: "Package detail fetched successfully!",
          data: { formattedResponse },
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error creating order", details: error.message });
    }
  });

  // ** get accessible menus by client with categoryId **
  router.get("/client/:token/:categoryId", async (req, res) => {
    const { token, categoryId } = req.params;
    console.log("token and categoryId", token, categoryId);
    // try {
    //   // ** search voucher by token and check is it still active or not **
    //   const voucher = await prisma.voucher.findUnique({
    //     where: {
    //       token,
    //     },
    //   });
    //   if (!voucher) {
    //     return res.status(404).json({ error: "Voucher is not found" });
    //   }
    //   if (voucher.isActive == false) {
    //     return res
    //       .status(404)
    //       .json({ error: "Voucher is not accessible anymore!" });
    //   }

    //   const packageId = voucher.packageId;
    //   const packageWithMenus = await prisma.package.findUnique({
    //     where: {
    //       id: packageId,
    //     },
    //     include: {
    //       PackageMenu: {
    //         select: {
    //           id: true,
    //           menu: true,
    //         },
    //       },
    //     },
    //   });

    //   const formattedResponse = {
    //     package: {
    //       id: packageWithMenus.id,
    //       packageName: packageWithMenus.packageName,
    //       packagePrice: packageWithMenus.packagePrice,
    //     },
    //     menus: packageWithMenus.PackageMenu.map((pkgMenu) => ({
    //       pkMenuId: pkgMenu.id,
    //       id: pkgMenu.menu.id,
    //       menuName: pkgMenu.menu.menuName,
    //       menuPhoto: pkgMenu.menu.menuPhoto,
    //       menuDescription: pkgMenu.menu.menuDescription,
    //     })),
    //   };

    //   res.status(200).json({
    //     message: "Package detail fetched successfully!",
    //     data: formattedResponse,
    //   });
    // } catch (error) {
    //   res
    //     .status(500)
    //     .json({ error: "Error fetching package", details: error.message });
    // }
  });

  // ** order accessible menus by client **
  router.post("/client/orderMenu", async (req, res) => {
    const { menus, tableId } = req.body;

    try {
      if (!tableId) {
        return res.status(400).json({ error: "tableId is required" });
      }
      const tableVoucher = await prisma.tableVoucher.findFirst({
        where: {
          tableId: parseInt(tableId),
          isActive: true,
        },
      });
      if (!tableVoucher) {
        return res.status(404).json({
          error: "No active TableVoucher found for the given tableId",
        });
      }
      const voucherId = tableVoucher.voucherId;

      // ** search voucher by token and check is it still active or not **
      const voucher = await prisma.voucher.findUnique({
        where: {
          id: voucherId,
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

      const totalPrice = menus.reduce(
        (total, menu) => total + menu.quantity * menu.price,
        0
      );

      const totalBills = parseInt(voucher.totalBills) + totalPrice;

      // *** updating total bills according to the order menus ***
      await prisma.voucher.update({
        where: {
          id: voucherId,
        },
        data: {
          totalBills: totalBills,
          // Add more fields as needed
        },
      });

      // *** Create orders for each menuId ***
      const createdOrders = await Promise.all(
        menus.map((menu) =>
          prisma.voucherMenu.create({
            data: {
              voucherId: parseInt(voucher.id),
              menuId: menu.menuId,
              quantity: menu.quantity,
              menuPrice: menu.menuPrice,
            },
          })
        )
      );

      res.status(200).json({
        message: "Orders created successfully!",
        data: createdOrders,
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error creating order", details: error.message });
    }
  });
};

const menuRoutes = (io) => {
  adminRoutes();
  clientRoutes();
  return router;
};

module.exports = menuRoutes;
