const express = require("express");
const mongoose = require("mongoose");
const Review = require("../model/review");
const { uploadV2 } = require("../multer");
const Order = require("../model/order");
const { Product } = require("../model/product");

const router = express.Router();

async function refreshProductRatings(productId) {
  if (!productId || !mongoose.Types.ObjectId.isValid(String(productId))) return;

  const stats = await Review.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(String(productId)),
      },
    },
    {
      $group: {
        _id: "$productId",
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  const avgRating = stats[0]?.avgRating ? Number(stats[0].avgRating.toFixed(1)) : 0;
  await Product.findByIdAndUpdate(productId, { ratings: avgRating });
}

router.post("/addReview", uploadV2.array("images", 5), async (req, res) => {
  try {
    const { productId, rating, comment,user, orderId } = req.body;
     

    if (!productId || !rating || !orderId) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID, Order ID, and rating are required" });
    }

     const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Optional: Prevent duplicate review for the same order
    if (order.review) {
      return res.status(400).json({ success: false, message: "This order already has a review" });
    }

    const images = (req.files || []).map(f => f.filename);

    const review = await Review.create({
      user,
      productId,
      orderId,
      rating,
      comment: comment || "",
      images,
    });
    await Order.findByIdAndUpdate(orderId, { review: review._id });
    order.review = review._id;
    await order.save();
    await Product.findByIdAndUpdate(productId, { $push: { reviews: review._id } });
    await refreshProductRatings(productId);

    res.json({ success: true, review });
  } catch (err) {
    console.error("Add review error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update review route
router.put(
  "/updateReview/:reviewId",
  uploadV2.array("images", 5), // max 5 images
  async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { rating, comment, existingImages } = req.body; // <-- get existingImages

      if (!reviewId) {
        return res
          .status(400)
          .json({ success: false, message: "Review ID is required" });
      }

      // Find existing review
      const review = await Review.findById(reviewId);
      if (!review) {
        return res
          .status(404)
          .json({ success: false, message: "Review not found" });
      }

      // Update rating & comment if provided
      if (rating) review.rating = rating;
      if (comment !== undefined) review.comment = comment;

      // Start with images the user wants to keep
      let updatedImages = [];
      if (existingImages) {
        // Parse JSON string from frontend
        updatedImages = JSON.parse(existingImages);
      }

      // Add any newly uploaded images
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map((f) => f.filename);
        updatedImages = [...updatedImages, ...newImages];
      }

      review.images = updatedImages; // overwrite old images with updated list

      await review.save();
      await refreshProductRatings(review.productId);

      res.json({ success: true, review });
    } catch (err) {
      console.error("Update review error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

router.get("/getProductReviews/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1; // Current page, default 1
    const limit = parseInt(req.query.limit) || 10; // Reviews per page, default 10
    const skip = (page - 1) * limit;

    // Fetch reviews with pagination
    const reviews = await Review.find({ productId })
      .populate("user", "name")
      .skip(skip)
      .limit(limit);

    // Optional: total count for frontend pagination
    const totalReviews = await Review.countDocuments({ productId });
    const totalPages = Math.ceil(totalReviews / limit);

    res.json({
      success: true,
      reviews,
      page,
      totalPages,
      totalReviews
    });
  } catch (err) {
    console.error("Get reviews error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;
