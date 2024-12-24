const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const { generateVoucherToken } = require("../utils");

const adminRoutes = (io) => {
  // Create a new voucher
  router.post("/", async (req, res) => {
    const { personCount, tableId, packageId, createdBy } = req.body;

    try {
      await prisma.$transaction(async (prisma) => {
        const token = generateVoucherToken();
        //  ** to check table is available atm or not **
        const table = await prisma.table.findUnique({
          where: {
            id: tableId,
          },
        });
        const isActiveTable = table.isActive;
        if (isActiveTable == true) {
          return res.status(409).json({
            error: "Table is not free",
            message: "The requested table is currently occupied.",
          });
        }

        // ** get package price **
        const package = await prisma.package.findUnique({
          where: {
            id: packageId,
          },
        });
        const pacakgePrice = package.packagePrice;
        const totalBills = pacakgePrice * personCount;
        const newVoucher = await prisma.voucher.create({
          data: {
            personCount,
            packageId,
            createdBy,
            token,
            totalBills,
          },
        });
        // ** updating table isActive Status **
        await prisma.table.update({
          where: {
            id: tableId,
          },
          data: {
            isActive: true,
          },
        });

        // *** creating records in junction table
        await prisma.tableVoucher.create({
          data: {
            tableId: tableId,
            voucherId: newVoucher.id,
          },
        });

        res.status(200).json({
          message: "Voucher created successfully!",
          data: newVoucher,
        });
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error creating package", details: error.message });
    }
  });

  // *** end voucher process ***
  router.patch("/endVoucher/:id", async (req, res) => {
    const { id } = req.params;
    const voucherId = parseInt(id);

    try {
      await prisma.$transaction(async (prisma) => {
        const updatedVoucher = await prisma.voucher.update({
          where: {
            id: voucherId,
          },
          data: {
            isActive: false,
          },
        });

        // Update isActive to false in TableVoucher
        await prisma.tableVoucher.updateMany({
          where: {
            voucherId: voucherId,
          },
          data: {
            isActive: false,
          },
        });

        // Update isActive to false in Table
        // First, fetch the `tableId` associated with the TableVoucher
        const tableVoucher = await prisma.tableVoucher.findFirst({
          where: {
            voucherId: voucherId,
          },
          select: {
            tableId: true,
          },
        });

        if (tableVoucher?.tableId) {
          await prisma.table.update({
            where: {
              id: tableVoucher.tableId,
            },
            data: {
              isActive: false,
            },
          });
        }
        res.status(200).json({
          message: "Voucher created successfully!",
          data: updatedVoucher,
        });
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error updating voucher", details: error.message });
    }
  });
};

const voucherRoutes = (io) => {
  adminRoutes(io);
  return router;
};

module.exports = voucherRoutes;
