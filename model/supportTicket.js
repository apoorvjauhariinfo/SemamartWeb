const mongoose = require("mongoose");

const supportMessageSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      enum: ["User", "Admin", "Seller"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  { _id: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    caseId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userType: {
      type: String,
      enum: ["Seller", "Customer", "Institute", "User"],
      required: true,
    },
    user: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["New", "Open", "In Progress", "Closed"],
      default: "New",
    },
    conversation: {
      type: [supportMessageSchema],
      default: [],
    },
    documents: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SupportTicket", supportTicketSchema);