const User = require("../Models/User");
const Note = require("../Models/Note");
const Contact = require("../Models/Contact");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

/* ================= AUTHENTICATION ================= */

exports.registerUser = async (req, res) => {
    try {
        const { firstName, email, password } = req.body;
        if (!firstName || !email || !password) {
            return res.status(400).json({ success: false, message: "Required registration fields are missing" });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Please provide a valid email address" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "This email is already registered in our system" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const username = firstName.replace(/\s+/g, "").toLowerCase() + Date.now();
        await User.create({
            img: "",
            firstName,
            username,
            email,
            password: hashedPassword
        });
        return res.status(201).json({ success: true, message: "User account created successfully" });
    } catch (error) {
        console.error("REGISTER ERROR =>", error);
        return res.status(500).json({ success: false, message: "Registration failed due to an internal error" });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Authentication requires both email and password" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid login credentials provided" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid login credentials provided" });
        }
        const token = jwt.sign({ id: user._id, email: user.email }, 'secretkey', { expiresIn: '1h' });
        return res.status(200).json({
            success: true,
            message: "Authentication successful, welcome back",
            token,
            user: { id: user._id, firstName: user.firstName, email: user.email, profileImage: user.img }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "System error during login process" });
    }
};

exports.verifyToken = (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Access denied: Missing authentication token" });
    try {
        const decoded = jwt.verify(token, "secretkey");
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ message: "Access denied: Invalid or expired token" });
    }
};

/* ================= PROFILE SETTINGS (FIXED) ================= */

exports.updateProfile = async (req, res) => {
    try {
        const { userId, firstName, currentPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "Target user profile not found" });

        // 1. Check if current password is correct (Security Step)
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Verification failed: Current password is incorrect" });
        }

        // 2. Update Basic Info
        if (firstName) user.firstName = firstName;
        
        // 3. Update Password (only if provided)
        if (newPassword && newPassword.trim().length >= 6) {
            user.password = await bcrypt.hash(newPassword, 10);
        }

        // 4. Update Profile Image (if uploaded)
        if (req.file) {
            user.img = req.file.filename; // Now it will save to DB
        }

        const updatedUser = await user.save();

        return res.status(200).json({
            success: true,
            message: "User profile updated successfully",
            user: { 
                id: updatedUser._id, 
                firstName: updatedUser.firstName, 
                email: updatedUser.email, 
                profileImage: updatedUser.img 
            }
        });
    } catch (error) {
        console.error("Update Error:", error);
        return res.status(500).json({ success: false, message: "Failed to update profile due to a server error" });
    }
};

/* ================= NOTES MANAGEMENT ================= */

exports.getUserNotes = async (req, res) => {
    try {
        const { userId } = req.params;
        const notes = await Note.find({ userId: userId }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, notes: notes || [] });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to retrieve user notes" });
    }
};

exports.updateTrashStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isDeleted } = req.body;
        await Note.findByIdAndUpdate(id, { isDeleted });
        return res.status(200).json({ success: true, message: isDeleted ? "Item moved to trash successfully" : "Item restored successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Action could not be completed" });
    }
};

exports.deleteNotePermanently = async (req, res) => {
    try {
        await Note.findByIdAndDelete(req.params.id);
        return res.status(200).json({ success: true, message: "Note permanently removed from database" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Permanent deletion failed" });
    }
};

exports.emptyTrash = async (req, res) => {
    try {
        const { userId } = req.params;
        await Note.deleteMany({ userId: userId, isDeleted: true });
        return res.status(200).json({ success: true, message: "Trash folder cleared successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Bulk deletion from trash failed" });
    }
};

exports.restoreAllNotes = async (req, res) => {
    try {
        const { userId } = req.params;
        await Note.updateMany({ userId: userId, isDeleted: true }, { isDeleted: false });
        return res.status(200).json({ success: true, message: "All items in trash have been restored" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to restore all notes" });
    }
};

/* ================= FILE UPLOAD ================= */

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

exports.upload = multer({ storage });

exports.uploadNote = async (req, res) => {
    try {
        const { title, category, userId } = req.body;
        
        if (!req.file) return res.status(400).json({ success: false, message: "No file was attached" });
        
        const finalUserId = userId || (req.user ? req.user.id : null);

        if (!finalUserId) {
            return res.status(401).json({ success: false, message: "User session not authenticated" });
        }

        const newNote = new Note({
            title: title,
            category: category,
            fileName: req.file.filename,
            userId: finalUserId,
            isDeleted: false
        });

        await newNote.save();
        return res.status(201).json({ 
            success: true, 
            message: "Document uploaded and saved successfully", 
            note: newNote 
        });
    } catch (error) {
        console.error("Upload Error:", error);
        return res.status(500).json({ success: false, message: "Server error encountered during upload" });
    }
};

/* ================= CONTACT FORM ================= */

exports.sendContactMessage = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        await Contact.create({ name, email, subject, message });
        return res.status(201).json({ success: true, message: "Inquiry sent successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to send inquiry" });
    }
};

/* ================= ADMIN PANEL ================= */

/* ================= ADMIN PANEL ================= */

/* ===== GET USERS ===== */
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().lean();

        const usersWithCount = await Promise.all(
            users.map(async (user) => {
                const count = await Note.countDocuments({
                    userId: user._id,
                    isDeleted: false
                });
                return { ...user, notesCount: count };
            })
        );

        res.status(200).json({ success: true, users: usersWithCount });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching users"
        });
    }
};


/* ===== DELETE USER ===== */
exports.deleteUserByAdmin = async (req, res) => {
    try {
        const id = req.params.id;

        const user = await User.findById(id);
        if (!user)
            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        await User.findByIdAndDelete(id);
        await Note.deleteMany({ userId: id });

        res.status(200).json({
            success: true,
            message: "User and related notes deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Admin delete failed"
        });
    }
};


/* ===== GET ACTIVE NOTES ONLY ===== */
exports.getAllNotesAdmin = async (req, res) => {
    try {
        const notes = await Note.find({ isDeleted: false }) // ⭐ FIXED
            .populate("userId", "firstName email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            notes
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch notes"
        });
    }
};


/* ===== MOVE NOTE TO TRASH ===== */
exports.moveNoteToTrashAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const note = await Note.findById(id);
        if (!note)
            return res.status(404).json({
                success: false,
                message: "Note not found"
            });

        note.isDeleted = true;
        await note.save();

        res.status(200).json({
            success: true,
            message: "Note moved to trash"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to move note"
        });
    }
};


/* ===== DELETE PERMANENT ===== */
exports.deleteNoteAdmin = async (req, res) => {
    try {
        await Note.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Note permanently deleted"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Delete failed"
        });
    }
};


/* ===== ADMIN STATS ===== */
exports.getAdminStats = async (req, res) => {
    try {
        const totalNotes = await Note.countDocuments({ isDeleted: false });
        const trashCount = await Note.countDocuments({ isDeleted: true });
        const totalUsers = await User.countDocuments();
        const messageCount = await Contact.countDocuments();

        res.status(200).json({
            success: true,
            stats: {
                totalNotes,
                totalUsers,
                messageCount,
                trashCount,
                totalCategories: 4
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Stats error"
        });
    }
};


/* ===== CONTACT QUERIES ===== */
exports.getAllQueries = async (req, res) => {
    try {
        const queries = await Contact.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            queries
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Query fetch failed"
        });
    }
};


exports.deleteQuery = async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Query deleted"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Delete failed"
        });
    }
};


/* ================= TRASH ================= */

exports.getAllTrashNotes = async (req, res) => {
    try {
        const notes = await Note.find({ isDeleted: true })
            .populate("userId", "firstName email")
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            notes
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Trash fetch error"
        });
    }
};


exports.restoreNoteAdmin = async (req, res) => {
    try {
        await Note.findByIdAndUpdate(req.params.id, {
            isDeleted: false
        });

        res.status(200).json({
            success: true,
            message: "Note restored"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Restore failed"
        });
    }
};


exports.emptyAllTrashAdmin = async (req, res) => {
    try {
        await Note.deleteMany({ isDeleted: true });

        res.status(200).json({
            success: true,
            message: "Trash cleared"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Empty failed"
        });
    }
};


exports.restoreAllTrashAdmin = async (req, res) => {
    try {
        await Note.updateMany(
            { isDeleted: true },
            { isDeleted: false }
        );

        res.status(200).json({
            success: true,
            message: "All notes restored"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Restore all failed"
        });
    }
};


/* ================= ADMIN LOGIN ================= */

exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (email === "admin@notestation.com" && password === "admin123") {
            const token = jwt.sign(
                { role: "admin" },
                "secretkey",
                { expiresIn: "12h" }
            );

            return res.status(200).json({
                success: true,
                message: "Welcome Admin",
                token
            });
        }

        res.status(401).json({
            success: false,
            message: "Invalid credentials"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};  