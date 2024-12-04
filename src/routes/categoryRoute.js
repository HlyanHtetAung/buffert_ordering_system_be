const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");

// get all categories
router.get("/", async (req, res) => {
  try {
    const allMenus = await prisma.category.findMany();
    res.status(200).json({
      message: "All categories fetched successfully!",
      data: allMenus,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error categories menus", details: error.message });
  }
});

module.exports = router;
