const File = require("../models/fileModel");
const User = require("../models/userModel");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const { generate } = require("../utils/generateUniqueNumber");
const fs = require("fs");

const generateToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateToken();
    return { accessToken };
  } catch (error) {
    console.log(error);
  }
};

exports.registerUser = async (req, res) => {
  try {
    const { userName, email, fullName, password } = req.body;
    console.log(userName, email, fullName, password);
    if (
      [userName, email, fullName, password].some(
        (field) => field?.trim() === ""
      )
    ) {
      console.log("All fields are required");
      res.status(400).json({
        status: "Bad Request",
        message: "All fields are required",
      });
    }

    const exitedUser = await User.findOne({
      $or: [{ userName }, { email }],
    });
    if (exitedUser) {
      res.status(400).json({
        status: "Bad Request",
        message: "User already exists",
      });
    }
    const user = await User.create({ userName, email, fullName, password });
    const createdUser = await User.findById(user._id).select("-password");

    if (!createdUser) {
      res.status(500).json({
        status: "Bad Request",
        message: "Something went wrong while creating the user",
      });
    }
    res.status(200).json({
      status: "success",
      message: "User created successfully",
      data: createdUser,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    if (!(userName || email)) {
      res.status(404).json({
        message: "Username or email is required",
      });
    }
    const user = await User.findOne({
      $or: [{ userName }, { email }],
    });
    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      res.status(401).json({
        message: "Invalid user credentials",
      });
    }

    const { accessToken } = await generateToken(user._id);
    console.log(accessToken);
    const loggedInUser = await User.findById(user._id).select("-password");
    const options = {
      httpOnly: true,
      secure: true,
    };
    console.log(loggedInUser);
    res.cookie("token", accessToken, options);
    return res.status(200).json({
      message: "User logged in successfully",
      user: loggedInUser,
      token: accessToken,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.logoutUser = async (req, res) => {
  try {
    const options = { httpOnly: true, secure: true };
    return res
      .status(200)
      .clearCookie("token", options)
      .json({ message: "User logged out successfully" });
  } catch (error) {
    console.log(error);
  }
};

exports.uploadFile = async (req, res) => {
  try {
    const filePath = req.file.path;
    console.log("filePath", filePath);
    if (!req.params.id) {
      res.status(404).json({ message: "User id is required" });
    }

    if (!filePath) {
      res.status(404).json({ message: "File path not found" });
    }
    const img = await uploadOnCloudinary(filePath);
    console.log(img);
    const uniqueNum = generate(6);
    const createFile = await File.create({
      fileName: img.url,
      code: uniqueNum,
      userId: req.params.id,
    });
    res
      .status(200)
      .json({ status: "success", message: "File created successfully" });
  } catch (error) {
    console.log("file uploading error", error);
  }
};

exports.getFiles = async (req, res) => {
  try {
    const files = await File.find({ userId: req.params.id });
    res.status(200).json({
      status: "success",
      message: "All Files",
      data: files,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await File.findByIdAndDelete(id);
    console.log(file);

    if (!file) {
      res.status(404).json({ message: "Couldn't delete" });
    }

    fs.unlinkSync(file?.fileName);

    res
      .status(200)
      .json({ status: "success", message: "File deleted successfully" });
  } catch (error) {
    console.log(error);
  }
};
