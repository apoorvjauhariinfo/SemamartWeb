const express = require("express");
const mongoose = require("mongoose");
const UserCart = require("../model/userCart");

const router = express.Router();

/**
 * ADD / UPDATE cart item
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

    // Atomic upsert (prevents duplicates & race conditions)
    const cartItem = await UserCart.findOneAndUpdate(
      { user_id, product_id, variant_id },
      { $inc: { qty } },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Cart updated",
      data: cartItem,
    });
  } catch (err) {
    console.error("Cart Add Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * GET cart items by user
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

    const items = await UserCart.find({ user_id: userId })
      .populate({
        path: "product_id",
        select: "name images brand category subCategory shopId",
      })
      .populate({
        path: "variant_id",
        select: "size colorOption originalPrice discountPrice stock thumbnail",
      })
      .lean();

    res.json({ success: true, data: items });
  } catch (err) {
    console.error("Cart Fetch Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * REMOVE single cart item
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

    const deleted = await UserCart.deleteOne({
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

    res.json({ success: true, message: "Item removed from cart" });
  } catch (err) {
    console.error("Cart Delete Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * CLEAR cart
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

    const deleted = await UserCart.deleteMany({ user_id });

    res.json({
      success: true,
      message: "Cart cleared",
      deletedCount: deleted.deletedCount,
    });
  } catch (err) {
    console.error("Cart Clear Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
