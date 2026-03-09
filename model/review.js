const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
  },
  images: {
    type: [String],
    default: [],
  },
}, { timestamps: true });

// Each user can review the same order only once
reviewSchema.index({ user: 1, orderId: 1 }, { unique: true });
// Optimize product review pagination (newest first).
reviewSchema.index({ productId: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
