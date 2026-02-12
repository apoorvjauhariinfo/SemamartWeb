const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "Please enter your firstName!"],
  },
  lastName: {
    type: String,
    required: [true, "Please enter your lastName!"],
  },
  email: {
    type: String,
    required: [true, "Please enter your email!"],
  },
  phoneNumber: {
    type: String,
  },
  instituteName: {
    type: String,
    required: [true, "Please enter your instituteName!"],
  },
  gstNumber: {
        type: String,
        required: [true, "Please enter your Institute's GST number!"],
      },
  name: {
    type: String,
    // required: [true, "Please enter your name!"],
  },

  password: {
    type: String,
    required: [true, "Please enter your password"],
    minLength: [4, "Password should be greater than 4 characters"],
    select: false,
  },

  addresses: [
    {
     
      reciever_name: {
        type: String,
        required: true,
        trim: true,
        match: [/^[a-zA-Z\s.'-]+$/, 'Invalid name format'] // Only letters, spaces, and basic punctuation
      },
      state: {
        type: String,
        required: true,
        trim: true,
        match: [/^[a-zA-Z\s]+$/, 'State must contain only letters and spaces']
      },
      district: {
        type: String,
        required: true,
        trim: true,
        match: [/^[a-zA-Z\s]+$/, 'District must contain only letters and spaces']
      },
      instituteAddress1: {
        type: String,
        required: true,
        trim: true
      },
      instituteAddress2: {
        type: String,
        trim: true,
        default: ''
      },
      pincode: {
        type: String,
        required: true,
        match: [/^\d{6}$/, 'Pincode must be exactly 6 digits'] // Strict 6-digit number
      },
      landmark: {
        type: String,
        trim: true,
        default: ''
      },
      alternatePhone: {
        type: String,
        match: [/^\d{10}$/, 'Alternate phone must be a 10-digit number'],
        default: ''
      },
      phone: {
        type: String,
        required: true,
        match: [/^\d{10}$/, 'Phone must be a 10-digit number']
      },
      addressType: {
        type: String,
        enum: ['Home', 'Work',],
        default: 'Home',
        required: true
      }

    },
  ],
  role: {
    type: String,
    default: "user",
    enum: ["seller", "user", "Admin"],
  },
  avatar: {
    type: String,
    // required: true,
  },
  registrationPdf: {
  type: String, // e.g. 'uploads/pdfs/<userId>.pdf'
},

  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordTime: Date,
  isVerified: {
    type: Boolean,
    required: true,
    default: false,
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