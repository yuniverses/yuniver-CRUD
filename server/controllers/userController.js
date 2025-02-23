// controllers/userController.js
const User = require("../models/User");

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Failed to get users" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const {
      username,
      password,
      role,
      name,
      avatar,
      email,
      selfIntro,
      note,
      phone,
      company,
      customerInfo,
    } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Missing username or password" });
    }
    // 只有 god 可以指定 admin 身份
    if (role === "admin" && req.user.role !== "god") {
      return res
        .status(403)
        .json({ message: "Insufficient permissions to assign admin role" });
    }
    const newUser = new User({
      username,
      password,
      role: role || "customer",
      name,
      avatar,
      email,
      selfIntro,
      note,
      phone,
      company,
      customerInfo,
    });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const {
      role,
      name,
      avatar,
      email,
      selfIntro,
      note,
      phone,
      company,
      customerInfo,
    } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 若嘗試修改角色，檢查權限：
    if (role && role !== user.role) {
      // 只有 god 可以將用戶設為 admin
      if (role === "admin" && req.user.role !== "god") {
        return res
          .status(403)
          .json({ message: "Insufficient permissions to assign admin role" });
      }
      // admin 與 god 可以將角色改為 employee 或 customer
      if (
        (role === "employee" || role === "customer") &&
        !["admin", "god"].includes(req.user.role)
      ) {
        return res
          .status(403)
          .json({ message: "Insufficient permissions to assign this role" });
      }
      // 不允許修改為 god 身份
      if (role === "god") {
        return res.status(403).json({ message: "Cannot assign god role" });
      }
      user.role = role;
    }

    if (name !== undefined) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (email !== undefined) user.email = email;
    if (selfIntro !== undefined) user.selfIntro = selfIntro;
    if (note !== undefined) user.note = note;
    if (phone !== undefined) user.phone = phone;
    if (company !== undefined) user.company = company;
    if (customerInfo !== undefined) user.customerInfo = customerInfo;

    await user.save();
    res.json(user);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};
