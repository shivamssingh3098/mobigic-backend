const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  uploadFile,
  logoutUser,
  getFiles,
  deleteFile,
} = require("../controllers/user.controller");
const { jwtVerify } = require("../middlewares/authMiddleware");
const { upload } = require("../middlewares/uploadMiddleware");

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router
  .route("/upload-file/:id")
  .post(jwtVerify, upload.single("file"), uploadFile);
router.route("/get-uploaded-file/:id").get(jwtVerify, getFiles);
router.route("/delete-uploaded-files/:id").delete(jwtVerify, deleteFile);

router.route("/logout").post(jwtVerify, logoutUser);

module.exports = router;
