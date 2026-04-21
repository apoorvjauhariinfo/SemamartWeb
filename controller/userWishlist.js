const express = require("express");
const mongoose = require("mongoose");
const UserWishlist = require("../model/userWishlist"); 
const { Product, ProductVariant } = require("../model/product");

const router = express.Router();

/**
 * ADD / UPDATE wishlist item
 */
router.post("/add", async (req, res) => {
  try {
    let { user_id, product_id, variant_id, qty } = req.body;

    if (!user_id || !product_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(user_id) ||
      !mongoose.Types.ObjectId.isValid(product_id) ||
      (variant_id && !mongoose.Types.ObjectId.isValid(variant_id))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID provided",
      });
    }

    variant_id = variant_id || null;
    qty = qty && qty > 0 ? qty : 1;

    const product = await Product.findOne({
      _id: product_id,
      visibilityByAdmin: true,
      visibilityBySeller: true,
    }).select("_id");

    if (!product) {
      return res.status(400).json({
        success: false,
        message: "This product is currently unavailable",
      });
    }

    if (variant_id) {
      const variant = await ProductVariant.findOne({
        _id: variant_id,
        productId: product_id,
      }).select("_id");

      if (!variant) {
        return res.status(400).json({
          success: false,
          message: "Selected variant is currently unavailable",
        });
      }
    }

    // Atomic upsert (no race condition)
    const item = await UserWishlist.findOneAndUpdate(
      { user_id, product_id, variant_id },
      { $inc: { qty } },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Wishlist updated",
      data: item,
    });
  } catch (err) {
    console.error("Wishlist Add Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * GET wishlist items by user
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const items = await UserWishlist.find({ user_id: userId })
      .populate({
        path: "product_id",
        select:
          "name images brand category subCategory shopId visibilityByAdmin visibilityBySeller",
      })
      .populate({
        path: "variant_id",
        select: "size colorOption originalPrice discountPrice stock thumbnail",
      })
      .lean();

    const visibleItems = items.filter(
      (item) =>
        item.product_id &&
        item.product_id.visibilityByAdmin === true &&
        item.product_id.visibilityBySeller === true,
    );

    if (visibleItems.length !== items.length) {
      const visibleIds = new Set(visibleItems.map((item) => String(item._id)));
      await UserWishlist.deleteMany({
        _id: {
          $in: items
            .filter((item) => !visibleIds.has(String(item._id)))
            .map((item) => item._id),
        },
      });
    }

    res.json({ success: true, data: visibleItems });
  } catch (err) {
    console.error("Wishlist Fetch Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * DELETE single wishlist item
 */
router.delete("/:user_id/:product_id/:variant_id", async (req, res) => {
  try {
    let { user_id, product_id, variant_id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(user_id) ||
      !mongoose.Types.ObjectId.isValid(product_id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID provided",
      });
    }

    variant_id = variant_id === "null" ? null : variant_id;

    if (variant_id && !mongoose.Types.ObjectId.isValid(variant_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid variant ID",
      });
    }

    const deleted = await UserWishlist.deleteOne({
      user_id,
      product_id,
      variant_id,
    });

    if (!deleted.deletedCount) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    res.json({ success: true, message: "Item removed from wishlist" });
  } catch (err) {
    console.error("Wishlist Delete Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * CLEAR wishlist
 */
router.delete("/clear/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const deleted = await UserWishlist.deleteMany({ user_id });

    res.json({
      success: true,
      message: "Wishlist cleared",
      deletedCount: deleted.deletedCount,
    });
  } catch (err) {
    console.error("Wishlist Clear Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
