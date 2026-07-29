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
    required: function () {
      return ["user", "seller"].includes(this.role);
    },
  },
  gstNumber: {
    type: String,
    required: function () {
      return ["user", "seller"].includes(this.role);
    },
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
    required: true,
  },
  permissions: {
    type: Object,
    default: {},
  },
  refundBankDetails: {
    accountHolderName: {
      type: String,
      trim: true,
      default: "",
    },
    accountNumber: {
      type: String,
      trim: true,
      default: "",
    },
    ifsc: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    bankName: {
      type: String,
      trim: true,
      default: "",
    },
    updatedAt: {
      type: Date,
      default: null,
    },
  },
  memberScope: {
    type: String,
    enum: ["admin", "user", "seller", null],
    default: null,
  },
  parentUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  parentSeller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  accountType: {
    type: String,
    enum: ["main", "member"],
    default: "main",
  },
  isSubMember: {
    type: Boolean,
    default: false,
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
  pendingNewEmail: String,
  emailChangeToken: String,
  emailChangeTokenExpire: Date,
  isVerified: {
    type: Boolean,
    required: true,
    default: false,
  },
});

userSchema.index({ email: 1 }, { unique: true });

//  Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
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
