const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
  },
  // Single product reference
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  // Variant reference (null if no variant selected)
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  qty: {
    type: Number,
    required: true,
    min: 1,
  },
  // We still keep `cart` for compatibility but now it will only contain one item
  cart: {
    type: [cartItemSchema],
    required: true,
  },
  shippingAddress: {
    type: Object,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: "Processing",
    enum: ["Processing", "Shipped", "Delivered", "Cancelled", "Refund Requested", "Refund Success"],
  },
paymentInfo: {
  id: { type: String },
  status: { type: String },
  method: { type: String }, // <-- rename from "type" to "method" (avoids clashing with mongoose "type" keyword)
},

  paidAt: {
    type: Date,
    default: Date.now,
  },
  deliveredAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);
