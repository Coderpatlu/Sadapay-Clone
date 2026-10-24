import User from "../Models/UserModel.js";
import jwt from "jsonwebtoken";

export const isAuthenticated = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Please Login First",
    });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  console.log("DECODED:", decoded);

  const user = await User.findById(decoded.id);

  console.log("USER:", user);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  req.user = user;

  next();
};
