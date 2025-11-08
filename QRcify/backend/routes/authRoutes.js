import express from "express";
import bcrypt from "bcrypt";
import { generateAuthToken } from "../utils/authUtils.js";
import User from "../models/user.js";

const router = express.Router();
// Test route
router.post("/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth routes are working!",
    timestamp: new Date().toISOString(),
  });
});
//register routr
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    //serching email or user exists or not , passward is hashed can't use them

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "user account already Exists with this mail." });
    } else {
      const newUser = await User.create({ name, email, password });

      console.log(" User created successfully:", newUser.id);
      return res.json({
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
      });
    }
  } catch (err) {
    console.error("failed to register", err);
    res.status(500).json({ message: "Registration failed." });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and passwaord are required." });
    }
    //to find the user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "User Not Found" });
    }
    //check Passward
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid Credentials." });
    }
    //generate JWT token
    const token = generateAuthToken(user);
    console.log("Login SUccessfull.", user.email);
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "internal Server error(auth)" });
  }
});

router.post("/logout", async (req, res) => {
  res.json({
    success: true,
    message: "Logout Successfull.",
  });
});
export default router;
