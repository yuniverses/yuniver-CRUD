// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["god", "admin", "employee", "customer"],
    default: "customer",
  },
  avatar: { type: String }, // 頭貼（圖片 URL）
  name: { type: String },
  email: { type: String },
  selfIntro: { type: String }, // 自我介紹
  note: { type: String },
  phone: { type: String },
  company: { type: String },
  customerInfo: {
    // 客戶資訊，可擴充更多結構
    interactions: [{ type: String }],
    projectRecords: [{ type: String }],
  },
});

// 儲存前加密密碼
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 密碼比對方法
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
