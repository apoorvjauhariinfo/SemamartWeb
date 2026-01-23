const mongoose = require("mongoose");

const adminNoteSchema = new mongoose.Schema(
  {
    note: {
      type: String,
      trim: true,
      required: true,
    },
    status: {
      type: String,
      enum: ["NEW", "CONTACTED", "APPROVED", "REJECTED", "CLOSED"],
      default: "NEW",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const bulkOrderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      default: null,
    },

    unitPrice: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    customerPrice: {
      type: Number,
      default: null,
    },

    comment: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["NEW", "CONTACTED", "APPROVED", "REJECTED", "CLOSED"],
      default: "NEW",
    },

    isSeenByAdmin: {
      type: Boolean,
      default: false,
    },

    /* ✅ THREAD OF ADMIN NOTES */
    adminNotes: [adminNoteSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BulkOrder", bulkOrderSchema);
