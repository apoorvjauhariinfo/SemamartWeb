const express = require("express");
const router = express.Router();
const BulkOrder = require("../model/bulkOrder");

// POST /api/bulk-order
router.post("/bulk-order", async (req, res) => {
  try {
    const { userId, productId, variantId, unitPrice, quantity, comment } = req.body;

    // Validate required fields
    if (!userId || !productId || !unitPrice || !quantity) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const bulkOrder = new BulkOrder({
      user_id: userId,
      product_id: productId,
      variant_id: variantId || null,
      unitPrice,
      quantity,
      comment,
    });

    await bulkOrder.save();

    return res.status(201).json({ success: true, message: "Bulk order created", bulkOrder });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/get-bulk-order", async (req, res) => {
  try {
    // Fetch all bulk orders and populate related fields
    const bulkOrders = await BulkOrder.find()
      .populate({ path: "user_id", select: "firstName lastName phoneNumber email" }) // populate user details
      .populate({ path: "product_id", select: "name " }) // populate product details
      .populate({ path: "variant_id", select: "discountPrice" }); // populate variant details

    return res.status(200).json({ success: true, bulkOrders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
