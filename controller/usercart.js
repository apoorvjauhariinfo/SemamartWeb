
const express = require("express");
const UserCart = require("../model/userCart"); // match file name exactly
const router = express.Router();


router.post("/add", async (req, res) => {
  try {
    const { user_id, product_id, variant_id, qty } = req.body;

    const newCart = await UserCart.create({
      user_id,
      product_id,
      variant_id,
      qty,
    });

    return res.json({
      success: true,
      message: "Cart item added",
      data: newCart,
    });

  } catch (error) {
    console.error("Cart Add Error:", error);
    return res.status(500).json({ success: false, error });
  }
});



// Get all cart items for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const items = await UserCart.find({ user_id: userId })
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

// Remove cart item
router.delete("/:user_id/:product_id/:variant_id", async (req, res) => {
  try {
    const { user_id, product_id, variant_id } = req.params;

    // Delete the item matching the user and product + variant
    const deleted = await UserCart.deleteOne({ user_id, product_id, variant_id });

    if (deleted.deletedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Item not found or does not belong to this user" 
      });
    }

    res.json({ success: true, message: "Item removed from cart" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

router.delete("/clear/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    console.log("Received user_id:", user_id);

    const deleted = await UserCart.deleteMany({ user_id });
    console.log("Deleted count:", deleted.deletedCount);

    if (deleted.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.json({
      success: true,
      message: "Cart cleared",
      deletedCount: deleted.deletedCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});


module.exports = router;