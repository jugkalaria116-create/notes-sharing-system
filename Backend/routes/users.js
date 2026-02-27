const express = require("express");
const router = express.Router();
const multer = require("multer");
const Note = require("../Models/Note");
const {
  registerUser,
  loginUser,
  verifyToken,
  uploadNote
} = require("../Controller/Controller");

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// --- Auth Routes ---
router.post("/register", registerUser);
router.post("/login", loginUser);

// --- Notes Routes (Ab sab /api/users ke andar hain) ---
// 1. Upload Note
router.post("/upload-note", verifyToken, upload.single("file"), uploadNote);

// 2. Get User Notes (Jo dashboard pe 404 de raha tha)
router.get("/notes/user/:userId", verifyToken, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ notes });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notes" });
  }
});

module.exports = router;