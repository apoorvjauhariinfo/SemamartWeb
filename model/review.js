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
    type: [String], // store image paths
    default: [],
  },
}, { timestamps: true });

// Prevent duplicate review per user per product
reviewSchema.index({ user: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
