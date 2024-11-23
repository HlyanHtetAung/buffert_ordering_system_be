const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");

const adminRoutes = (io) => {
  // Create a new table
  router.post("/", async (req, res) => {
    const { tableName } = req.body;

    try {
      const lastTable = await prisma.table.findFirst({
        orderBy: {
          tableNo: "desc", // Get the highest tableNo
        },
      });

      // Generate the new tableNo (increment by 1 if there's an existing tableNo, else start with 1)
      const newTableNo = lastTable ? lastTable.tableNo + 1 : 1;

      // Create the new table
      const newTable = await prisma.table.create({
        data: {
          tableNo: newTableNo,
          tableName,
        },
      });

      res.status(200).json({
        message: "Table created successfully!",
        data: newTable,
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error creating table", details: error.message });
    }
  });

  // get all tables
  router.get("/", async (req, res) => {
    try {
      const allTables = await prisma.table.findMany();
      res.status(200).json({
        message: "All Tables fetched successfully!",
        data: allTables,
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error fetching tables", details: error.message });
    }
  });
};

const tableRoutes = (io) => {
  adminRoutes(io);
  return router;
};

module.exports = tableRoutes;
