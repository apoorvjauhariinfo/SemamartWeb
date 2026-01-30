const express = require("express");
const router = express.Router();
const BulkOrder = require("../model/bulkOrder");
const { Product } = require("../model/product");
const sendBulkOrderRequestAdminEmail = require("../utils/emails/bulkOrderRequestAdmin");
const sendBulkOrderRequestCustomerEmail = require("../utils/emails/bulkOrderRequestCustomer");
const mongoose = require("mongoose"); // Add this

const ALLOWED_STATUSES = ["NEW", "CONTACTED", "APPROVED", "REJECTED", "CLOSED"];

router.post("/bulk-order", async (req, res) => {
  try {
    const {
      userId,
      productId,
      variantId,
      unitPrice,
      quantity,
      comment,
      customerPrice,
    } = req.body;

    if (!userId || !productId || !unitPrice || !quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const bulkOrder = new BulkOrder({
      user_id: userId,
      product_id: productId, // Mongoose usually handles the string-to-OID cast here
      variant_id: variantId || null,
      unitPrice,
      quantity,
      comment,
      customerPrice: customerPrice || null,
    });

    await bulkOrder.save();

    // ✅ NEW POPULATION LOGIC: Use the Model object directly
    const populatedBulkOrder = await BulkOrder.findById(bulkOrder._id)
      .populate({
        path: "user_id",
        select: "firstName lastName email phoneNumber instituteName",
      })
      .populate({
        path: "product_id",
        model: Product, // <--- FORCES the use of the Product model
        select: "name",
      })
      .populate({ path: "variant_id", select: "discountPrice" });
    if (!populatedBulkOrder.product_id) {
      // This means the ID sent (productId) does not exist in the 'products' collection
      return res
        .status(404)
        .json({ success: false, message: "Product not found in database" });
    }

    // Now name should definitely be there
    const pName = populatedBulkOrder.product_id.name;

    const productsForEmail = [
  {
    name: populatedBulkOrder.product_id ? populatedBulkOrder.product_id.name : "Unknown Product", // Change 'productName' to 'name'
    unitPrice: populatedBulkOrder.unitPrice,
    quantity: populatedBulkOrder.quantity,
    customerPrice: populatedBulkOrder.customerPrice || "N/A",
    variantPrice: populatedBulkOrder.variant_id?.discountPrice || "Standard",
  },
];

    const notes = populatedBulkOrder.comment
      ? [populatedBulkOrder.comment]
      : [];

    // Send Emails
    await sendBulkOrderRequestAdminEmail({
      instituteName:
        populatedBulkOrder.user_id.instituteName ||
        `${populatedBulkOrder.user_id.firstName} ${populatedBulkOrder.user_id.lastName}`,
      instituteEmail: populatedBulkOrder.user_id.email,
      institutePhone: populatedBulkOrder.user_id.phoneNumber,
      products: productsForEmail,
      notes,
    });

    await sendBulkOrderRequestCustomerEmail({
      customerEmail: populatedBulkOrder.user_id.email,
      customerName: populatedBulkOrder.user_id.firstName,
      products: productsForEmail,
      notes,
    });

    return res
      .status(201)
      .json({ success: true, message: "Bulk order created", bulkOrder });
  } catch (error) {
    console.error("Bulk Order Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/get-bulk-order", async (req, res) => {
  try {
    // Fetch all bulk orders and populate related fields
    const bulkOrders = await BulkOrder.find()
      .populate({
        path: "user_id",
        select: "firstName lastName phoneNumber email instituteName",
      }) // populate user details
      .populate({ path: "product_id", select: "name " }) // populate product details
      .populate({ path: "variant_id", select: "discountPrice" }) // populate variant details
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, bulkOrders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/bulk-orders/user/:userId
router.get("/bulk-orders/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing userId" });
    }

    // Fetch bulk orders for this user and populate related fields
    const bulkOrders = await BulkOrder.find({ user_id: userId })
      .populate({
        path: "user_id",
        select: "firstName lastName phoneNumber email instituteName",
      })
      .populate({ path: "product_id", select: "name" })
      .populate({ path: "variant_id", select: "discountPrice" })
      .sort({ createdAt: -1 }); // newest first

    return res.status(200).json({ success: true, bulkOrders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* -------------------- UPDATE BULK ORDER STATUS -------------------- */
/**
 * PATCH /api/v2/bulkorder/update-status/:id
 * body: { status: "PENDING" }
 */

router.patch("/update-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, adminId } = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const bulkOrder = await BulkOrder.findById(id);

    if (!bulkOrder) {
      return res.status(404).json({
        success: false,
        message: "Bulk order not found",
      });
    }

    // Prevent updating closed orders (optional)
    if (bulkOrder.status === "CLOSED") {
      return res.status(400).json({
        success: false,
        message: "Closed orders cannot be updated",
      });
    }

    // Update status
    bulkOrder.status = status;

    // Add admin note ONLY if note is provided
    if (note && note.trim()) {
      bulkOrder.adminNotes.push({
        note,
        status,
        createdAt: new Date(),
      });
    }

    await bulkOrder.save();

    return res.status(200).json({
      success: true,
      message: "Status updated",
      bulkOrder,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
