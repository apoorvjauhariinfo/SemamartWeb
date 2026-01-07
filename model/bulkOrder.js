const mongoose = require("mongoose");

const bulkOrderSchema = new mongoose.Schema(
  {
    // Customer reference
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

    comment: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["NEW", "PENDING", "QUOTED", "APPROVED", "REJECTED", "CLOSED"],
      default: "NEW",
    },

    isSeenByAdmin: {
      type: Boolean,
      default: false,
    },

    adminNote: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BulkOrder", bulkOrderSchema);
