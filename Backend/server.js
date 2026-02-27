const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");

// Database connection
require("./Config/db");

const app = express();

// Controllers
const userCtrl = require("./Controller/Controller");


// ================= MIDDLEWARE =================
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// static folder for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ================= ROUTES =================

// Auth
app.post("/api/users/register", userCtrl.registerUser);
app.post("/api/users/login", userCtrl.loginUser);

// Notes
app.get("/api/users/notes/user/:userId", userCtrl.verifyToken, userCtrl.getUserNotes);
app.post("/api/users/upload-note", userCtrl.verifyToken, userCtrl.upload.single("file"), userCtrl.uploadNote);
app.patch("/api/users/notes/trash/:id", userCtrl.verifyToken, userCtrl.updateTrashStatus);
app.delete("/api/users/notes/:id", userCtrl.verifyToken, userCtrl.deleteNotePermanently);
app.delete("/api/users/notes/trash/empty/:userId", userCtrl.verifyToken, userCtrl.emptyTrash);
app.post("/api/users/notes/trash/restore-all/:userId", userCtrl.verifyToken, userCtrl.restoreAllNotes);

// Profile
app.post("/api/users/update-profile", userCtrl.verifyToken, userCtrl.upload.single("profileImage"), userCtrl.updateProfile);


// ================= CONTACT ROUTE (ADDED) =================
// ================= CONTACT ROUTE (ADDED) =================
app.post("/api/users/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // save to database
    const savedMessage = await userCtrl.sendContactMessage({
      body: { name, email, subject, message }
    }, res);

  } catch (err) {
    console.error("Contact API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while sending message"
    });
  }
});

// ================= ADMIN =================
app.get("/api/admin/all-users", userCtrl.getAllUsers);
app.delete("/api/admin/user/:id", userCtrl.deleteUserByAdmin);

app.get("/api/admin/all-notes", userCtrl.getAllNotesAdmin);
app.delete("/api/admin/note-delete/:id", userCtrl.deleteNoteAdmin);

app.get("/api/admin/stats", userCtrl.getAdminStats);

app.get("/api/admin/queries", userCtrl.getAllQueries);
app.delete("/api/admin/query/:id", userCtrl.deleteQuery);

app.get("/api/admin/trash-notes", userCtrl.getAllTrashNotes);
app.patch("/api/admin/restore-note/:id", userCtrl.restoreNoteAdmin);
app.delete("/api/admin/empty-trash", userCtrl.emptyAllTrashAdmin);
app.post("/api/admin/restore-all-trash", userCtrl.restoreAllTrashAdmin);

app.post("/api/admin/login", userCtrl.adminLogin);


// ================= DEFAULT ROUTE =================
app.get("/", (req, res) => {
  res.send("🚀 API Server Running Successfully");
});


// ================= SERVER START =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});