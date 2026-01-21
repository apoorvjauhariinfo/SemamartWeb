const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const NotifyRequest = require("../model/notifyRequest");

router.post("/add", async (req, res) => {
  try {
    let { user_id, product_id, variant_id, email, shop_id } = req.body;

    // Normalize variant_id
    variant_id = variant_id || null;

    // Handle populated shop object
    if (shop_id && typeof shop_id === "object" && shop_id._id) {
      shop_id = shop_id._id;
    }

    // Validate required fields
    if (!user_id || !product_id || !email || !shop_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (user_id, product_id, email, shop_id)",
      });
    }

    // Validate ObjectIds
    const ids = [user_id, product_id, shop_id];
    if (variant_id) ids.push(variant_id);

    if (!ids.every(id => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ success: false, message: "Invalid ID provided" });
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    // Check if an unnotified request already exists
    const existing = await NotifyRequest.findOne({
      user_id,
      product_id,
      variant_id,
      email,
      shop_id,
      notified: false,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Notify request already exists for this product",
        data: existing,
      });
    }

    // Create new notify request
    const notifyRequest = new NotifyRequest({ user_id, product_id, variant_id, shop_id, email });
    await notifyRequest.save();

    res.status(200).json({
      success: true,
      message: "Notify request saved",
      data: notifyRequest,
    });
  } catch (err) {
    // Handle duplicate error from partial index
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Notify request already exists (duplicate unnotified record)",
      });
    }

    console.error("Notify Request Add Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// GET /api/notify-request
router.get("/", async (req, res) => {
  try {
    const data = await NotifyRequest.find()
      .sort({ createdAt: -1 })
      .populate("product_id", "name minmaxrule")
      .populate("variant_id", "size colorOption stock thumbnail discountPrice")
      .populate("shop_id", "businessName")
      .populate("user_id", "instituteName email");

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("Notify Request Get Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


module.exports = router;
