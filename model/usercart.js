const mongoose = require("mongoose");

const UserCartSchema = new mongoose.Schema(
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
    qty: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { timestamps: true }
);

// Prevent duplicate cart items
UserCartSchema.index(
  { user_id: 1, product_id: 1, variant_id: 1 },
  { unique: true }
);

module.exports = mongoose.model("UserCart", UserCartSchema);
