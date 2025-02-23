//server/middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    // 获取 Authorization header
    const token = req.header("Authorization").replace("Bearer ", "");
    console.log("Received token:", token); // 日志输出接收到的 token

    // 尝试解密 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded); // 日志输出解密后的 token

    // 查找用户
    const user = await User.findOne({ _id: decoded.userId });
    if (!user) {
      console.log("User not found"); // 用户未找到的日志
      throw new Error();
    }

    // 将用户信息传递到请求对象中
    req.user = user;
    console.log("Authenticated user:", req.user); // 日志输出已认证的用户信息

    // 继续执行后续中间件或路由
    next();
  } catch (error) {
    console.error("Authentication error:", error); // 捕捉到的错误日志
    res.status(401).send({ error: "Please authenticate." }); // 如果无法认证，返回 401
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    console.log("User role:", req.user ? req.user.role : "No user found"); // 输出当前用户的角色

    // 检查角色是否符合要求
    if (!roles.includes(req.user.role)) {
      console.log("Forbidden: Insufficient permissions"); // 权限不足的日志
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions" });
    }

    // 如果角色符合，继续执行后续操作
    next();
  };
};
module.exports = { auth, checkRole };
