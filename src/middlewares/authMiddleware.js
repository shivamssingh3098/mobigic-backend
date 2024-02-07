const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.jwtVerify = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token || req.header("Authorization")?.replace("Bearer", "");
    if (!token) {
      return res.status(401).json({
        message: "Unauthorized request",
      });
    }
    console.log("Token", token);
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("decodedToken", decodedToken);
    const user = await User.findById(decodedToken?._id).select("-password");
    if (!user) {
      res.status(401).json({
        message: "Invalid access token",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
  }
};
