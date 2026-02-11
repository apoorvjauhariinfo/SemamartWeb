const mongoose = require("mongoose");

const checkoutSessionSchema = new mongoose.Schema({
  paymentGroupId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  cart: {
    type: Array,
    required: true,
    default: [],
  },
  shippingAddress: {
    type: Object,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    default: "HDFC",
  },
  status: {
    type: String,
    enum: ["PENDING", "CHARGED", "FAILED", "ORDER_CREATED"],
    default: "PENDING",
  },
  hdfcSessionId: {
    type: String,
    default: null,
  },
  hdfcStatus: {
    type: String,
    default: null,
  },
  paymentId: {
    type: String,
    default: null,
  },
  createdOrderIds: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Order",
    default: [],
  },
  errorMessage: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CheckoutSession", checkoutSessionSchema);
