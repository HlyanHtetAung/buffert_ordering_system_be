const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const { generateVoucherToken } = require("../utils");

// Create a new voucher
router.post("/", async (req, res) => {
  const { personCount, tableId, packageId, createdBy } = req.body;

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
  try {
    const newVoucher = await prisma.voucher.create({
      data: {
        personCount,
        tableId,
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

    res.status(201).json({
      message: "Voucher created successfully!",
      data: newVoucher,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error creating package", details: error.message });
  }
});

// *** end voucher process ***
router.patch("/endVoucher/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // ** changing voucher isActive status to false **
    const updatedVoucher = await prisma.voucher.update({
      where: {
        id: parseInt(id, 10),
      },
      data: {
        isActive: false,
      },
    });

    //  ** changing table active state to false when the voucher is finshed **
    await prisma.table.update({
      where: { id: updatedVoucher.tableId },
      data: {
        isActive: false,
      },
    });

    res.status(200).json({
      message: "Voucher is finished",
      data: updatedVoucher,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error updating voucher", details: error.message });
  }
});

module.exports = router;
