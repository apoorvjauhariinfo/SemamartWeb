const mongoose = require("mongoose");
const ErrorHandler = require("../utils/ErrorHandler");

// need to add platform commision in order

const orderStatusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: [
      "Created",
      "Paid",
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
    required: true,
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
  tax: {
    type: Number,
    required: true,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: "Created",
    enum: [
      "Created",
      "Paid",
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
  trackingDetails: {
    logisticPartner: { type: String, trim: true },
    pickupPerson: { type: String, trim: true },
    pickupPersonPhone: { type: Number, trim: true },
    trackingNumber: { type: String, trim: true },
    trackingDocument: { type: String },
  },
  paymentFile: {
    type: String,
    default: null,
  },
});

const MAIN_FLOW = [
  "Created",
  "Paid",
  "Processing",
  "Packed",
  "Shipped",
  "Delivered",
];

function isValidStatusChange(current, next) {
  if (current === next) return true;

  const currentIndex = MAIN_FLOW.indexOf(current);
  const nextIndex = MAIN_FLOW.indexOf(next);
  if (currentIndex === -1 || nextIndex === -1) return false;
  // Only allow next step
  return nextIndex === currentIndex + 1;
}

orderSchema.pre("save", async function (next) {
  if (!this.isModified("status")) return next();
  if (this.isNew) return next();

  const prevOrder = await this.constructor.findById(this._id).select("status");
  const prevStatus = prevOrder.status;
  if (!isValidStatusChange(prevStatus,this.status)){
   return next(new ErrorHandler(`Invalid order status change from ${prevStatus} to ${this.status}`,400))
  }
  next()
});

module.exports = mongoose.model("Order", orderSchema);
