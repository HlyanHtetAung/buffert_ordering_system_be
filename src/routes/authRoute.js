const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");

var jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
  const expirationTime = Math.floor(Date.now() / 1000) + 60;
  const userWithoutExp = { ...user, exp: expirationTime }; // this is for expiresIn conflit error
  return jwt.sign(userWithoutExp, process.env.ACCESS_TOKEN_SECRET_KEY);
};

const generateRefreshToken = (user) => {
  const expirationTime = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days in seconds
  const userWithoutExp = { ...user, exp: expirationTime }; // this is for expiresIn conflit error
  return jwt.sign(userWithoutExp, process.env.REFRESH_TOKEN_SECRET_KEY);
};

// login route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }

  try {
    // Find user by username
    const user = await prisma.user.findFirst({
      where: { username: username },
    });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid username or password." });
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    res.status(200).json({ user, accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

// Generate a new access token using the refresh token
router.post("/refresh-token", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.sendStatus(401);
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET_KEY,
    (err, user) => {
      if (err)
        return res.status(403).json({ message: "Invalid or expired token." });

      const accessToken = generateAccessToken(user);
      res.status(200).json({ accessToken });
    }
  );
});

module.exports = router;
