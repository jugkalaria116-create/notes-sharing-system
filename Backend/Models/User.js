const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    img: {
      type: String,
      default: ""
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    username: {
      type: String,
      unique: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
