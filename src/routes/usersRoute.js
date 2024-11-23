const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");

// Create a new user
router.post("/", async (req, res) => {
  const { username, roleId, password } = req.body;

  try {
    // Create a new user
    const newUser = await prisma.user.create({
      data: {
        username,
        password,
        roleId: parseInt(roleId),
      },
    });

    res.status(200).json({
      message: "User created successfully!",
      data: newUser,
    }); // Send back the created user
  } catch (error) {
    console.log(error.message);
  }
});

module.exports = router;
