const mongoose = require("mongoose");

const orderStatusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: [
      "Processing",
      "Packed",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Refund Requested",
      "Refund Success",
    ],
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});


const orderSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
  },
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductVariant",
    default: null,
  },
  qty: {
    type: Number,
    required: true,
    min: 1,
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
    enum: [
      "Processing",
      "Packed",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Refund Requested",
      "Refund Success",
    ],
    required:true
  },
  paymentInfo: {
    id: { type: String },
    status: { type: String },
    method: { type: String },
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
  statusHistory: [orderStatusHistorySchema],
});

module.exports = mongoose.model("Order", orderSchema);
