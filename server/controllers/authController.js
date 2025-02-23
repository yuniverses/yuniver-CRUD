// controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username, password });
    await user.save();
    res.status(201).json({ message: "User registered", userId: user._id });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "User not found" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { userId: user._id, role: user.role }, // 確保角色也包含在 token 中
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 返回包括角色（role）的資料
    console.log("Login response:", {
      message: "Login successful",
      token,
      role: user.role,
    });
    res.json({ message: "Login successful", token, role: user.role });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Login failed" });
  }
};
