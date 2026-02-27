const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    fileName: { type: String, required: true },
    // Yeh line check karo - Ref 'User' hona chahiye
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);