const express = require("express");
const UserWishlist = require("../model/userWishlist"); // match file name exactly
const router = express.Router();

// Add item to cart
router.post("/add", async (req, res) => {
  try {
    const { user_id, product_id, variant_id, qty } = req.body;

    if (!user_id || !product_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    // Check if product already exists in wishlist
    const existingItem = await UserWishlist.findOne({
      user_id,
      product_id,
      variant_id
    });

    if (existingItem) {
      existingItem.qty = (existingItem.qty || 1) + (qty || 1);
      await existingItem.save();

      return res.json({
        success: true,
        message: "Wishlist updated",
        data: existingItem,
      });
    }

    // Create new wishlist item
    const newItem = await UserWishlist.create({
      user_id,
      product_id,
      variant_id: variant_id || null,
      qty: qty || 1,
    });

    return res.json({
      success: true,
      message: "Added to wishlist",
      data: newItem,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});


// Get all cart items for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const items = await UserWishlist.find({ user_id: userId })
      .populate({
        path: "product_id",
        model: "Product",
        populate: {
          path: "variants",
          model: "ProductVariant"
        }
      })
      .populate({
        path: "variant_id",
        model: "ProductVariant"
      });

    res.json({ success: true, data: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});




router.delete("/:user_id/:product_id/:variant_id", async (req, res) => {
  try {
    const { user_id, product_id, variant_id } = req.params;

    // Convert "null" string to actual null
    const variantIdValue = variant_id === "null" ? null : variant_id;

    const deleted = await UserWishlist.deleteOne({
      user_id,
      product_id,
      variant_id: variantIdValue,
    });

    if (deleted.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found or does not belong to this user",
      });
    }

    res.json({ success: true, message: "Item removed from wishlist" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});




// DELETE /api/v2/wishlist/clear/:user_id
router.delete("/clear/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "User ID required",
      });
    }

    // Delete all wishlist items for this user
    const deleted = await UserWishlist.deleteMany({ user_id });

    res.json({
      success: true,
      message: "Wishlist cleared",
      deletedCount: deleted.deletedCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});



module.exports = router;