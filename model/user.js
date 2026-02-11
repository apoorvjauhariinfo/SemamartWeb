const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "Please enter your first name"],
    trim: true,
  },

  lastName: {
    type: String,
    required: [true, "Please enter your last name"],
    trim: true,
  },

  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: true,
    lowercase: true,
    trim: true,
  },

  phoneNumber: {
    type: String,
    trim: true,
  },

  // ================= CONDITIONAL FIELDS =================
  instituteName: {
    type: String,
    required: function () {
      return this.role === "user" || this.role === "seller";
    },
  },

  gstNumber: {
    type: String,
    required: function () {
      return this.role === "user" || this.role === "seller";
    },
  },

  // ================= SECURITY =================
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minlength: [8, "Password must be at least 8 characters"],
    select: false,
  },

  // ================= ROLE =================
  role: {
    type: String,
    enum: ["user", "seller", "Admin", "Product Manager", "Accountant"],
    default: "user",
  },

  // ================= ADDRESS =================
  addresses: [
    {
      reciever_name: { type: String, trim: true },
      state: { type: String, trim: true },
      district: { type: String, trim: true },
      instituteAddress1: { type: String },
      instituteAddress2: { type: String, default: "" },
      pincode: {
        type: String,
        match: [/^\d{6}$/, "Pincode must be 6 digits"],
      },
      landmark: { type: String, default: "" },
      alternatePhone: { type: String, default: "" },
      phone: { type: String },
      addressType: {
        type: String,
        enum: ["Home", "Work"],
        default: "Home",
      },
    },
  ],

  // ================= FILES =================
  avatar: {
    type: String,
  },

  registrationPdf: {
    type: String,
  },

  // ================= META =================
  isVerified: {
    type: Boolean,
    default: false,
  },

  resetPasswordToken: String,
  resetPasswordTime: Date,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});


//  Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);
});

// jwt token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

// compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
