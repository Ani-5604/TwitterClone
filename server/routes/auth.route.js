import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

import {
  getMe,
  login,
  logout,
  signup,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

// Protected route to get the current user
router.get("/me", protectRoute, getMe);

// Public routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
// Route for Google login
router.post('/api/auth/login/google', async (req, res) => {
  const { tokenId, username, fullName, email } = req.body;

  try {
    // Step 1: Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(tokenId);
    console.log('Decoded Firebase Token:', decodedToken);

    // Step 2: Retrieve or create user in your database (replace with your DB logic)
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ username, fullName, email });
    }

    // Step 3: Generate your own JWT for authentication
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Step 4: Respond with the JWT token
    res.status(200).json({ token: jwtToken });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ message: 'Google authentication failed.' });
  }
});

// Token Verification Route
router.post("/verify-token", async (req, res) => {
  const token = req.body.token;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    res.status(200).json({ message: "Token verified successfully", decodedToken });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});


export default router;
