const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const Order = require("../model/order");
const Shop = require("../model/shop");
const {Product} = require("../model/product");
const PDFDocument = require("pdfkit");

// ✅ Create new order(s)
router.post(
  "/create-order",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { cart, shippingAddress, user, totalPrice, paymentInfo } = req.body;

      if (!cart || cart.length === 0) {
        return next(new ErrorHandler("Cart is empty", 400));
      }

      const orders = [];

      // 🔥 Split each cart item into its own order
      for (const item of cart) {
        const order = await Order.create({
          shop: item.shopId,
          // product: item.productId,
          variant: item.variantId || null,
          qty: item.qty,
          // cart: [item], // legacy support
          shippingAddress,
          user,
          totalPrice: item.totalPrice, // ✅ use per-item totalPrice
          paymentInfo,
        });
        orders.push(order);
      }

      res.status(201).json({ success: true, orders });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.get(
  "/get-order-details/:orderId",
  catchAsyncErrors(async (req, res) => {
    const order = await Order.findById(req.params.orderId).populate(
      "cart.productId",
      "variants name"
    );

    if (!order) {
      res.status(404).send("Order not Found");
    }

    res.json(order);
  })
);

router.get(
  "/get-order-details-seller/:orderId",
  catchAsyncErrors(async (req, res) => {
    const order = await Order.findById(req.params.orderId).populate({
      path: "variant",
      populate: {
        path: "productId",
        select: "name",
      },
    });

    if (!order) {
      res.status(404).send("Order not Found");
    }

    res.json(order);
  })
);

// ✅ Get all orders of a user
router.get(
  "/get-all-orders/:userId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const userId = new mongoose.Types.ObjectId(req.params.userId);

      const orders = await Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate("product")
        .populate("variant")
        .populate("shop")
        .populate("user");

      res.status(200).json({ success: true, orders });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ✅ Get all orders of a seller
router.get(
  "/get-seller-all-orders/:shopId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find({ shop: req.params.shopId })
        .select("-shippingAddress -paymentInfo")
        .populate("user", "firstName lastName")
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, orders });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ✅ Update order status (for sellers)
router.put(
  "/update-order-status/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id)
        .populate("variant");

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      if (req.body.status === "Transferred to delivery partner") {
        await updateStock(order.variant.productId, order.qty);
      }

      order.status = req.body.status;

      if (req.body.status === "Delivered") {
        order.deliveredAt = Date.now();
        order.paymentInfo.status = "Succeeded";

        const serviceCharge = order.totalPrice * 0.1;
        await updateSellerInfo(order.shop, order.totalPrice - serviceCharge);
      }

      await order.save({ validateBeforeSave: false });

      res.status(200).json({ success: true, order });

      async function updateStock(productId, qty) {
        const product = await Product.findById(productId);
        if (product) {
          product.stock -= qty;
          product.sold_out += qty;
          await product.save({ validateBeforeSave: false });
        }
      }

      async function updateSellerInfo(shopId, amount) {
        const seller = await Shop.findById(shopId);
        if (seller) {
          seller.availableBalance = (seller.availableBalance || 0) + amount;
          await seller.save();
        }
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ✅ Refund request (user)
router.put(
  "/order-refund/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      order.status = req.body.status;
      await order.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        order,
        message: "Order Refund Request successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ✅ Refund approval (seller)
router.put(
  "/order-refund-success/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id)
        .populate("product")
        .populate("variant");

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      order.status = req.body.status;
      await order.save();

      res.status(200).json({
        success: true,
        message: "Order Refund successful!",
      });

      if (req.body.status === "Refund Success") {
        await restoreStock(order.product._id, order.qty);
      }

      async function restoreStock(productId, qty) {
        const product = await Product.findById(productId);
        if (product) {
          product.stock += qty;
          product.sold_out -= qty;
          await product.save({ validateBeforeSave: false });
        }
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ✅ Admin: get all orders
router.get(
  "/admin-all-orders",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find()
        .sort({ deliveredAt: -1, createdAt: -1 })
        .populate("product")
        .populate("variant")
        .populate("shop")
        .populate("user");

      res.status(200).json({ success: true, orders });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ✅ Generate invoice per order
router.get("/invoice/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId)
      .populate("product")
      .populate("variant")
      .populate("user");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${orderId}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // 📄 Header
    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Order ID: ${order._id}`);
    doc.text(`Order Date: ${new Date(order.createdAt).toLocaleString()}`);
    doc.text(`Order Status: ${order.status}`);
    doc.moveDown();

    // 📦 Shipping Address
    doc.fontSize(14).text("Shipping Address:", { underline: true });
    const address = order.shippingAddress;
    if (address) {
      doc
        .fontSize(12)
        .text(`${address.instituteAddress1}, ${address.instituteAddress2}`);
      doc.text(`${address.district}, ${address.state} - ${address.pincode}`);
      doc.text(`Landmark: ${address.landmark}`);
    }
    doc.moveDown();

    // 💳 Payment Info
    doc.fontSize(14).text("Payment Info:", { underline: true });
    const payment = order.paymentInfo || {};
    doc.fontSize(12).text(`Method: ${payment.method || "N/A"}`);
    doc.text(`Status: ${payment.status || "N/A"}`);
    doc.text(
      `Paid At: ${
        order.paidAt ? new Date(order.paidAt).toLocaleString() : "N/A"
      }`
    );
    doc.moveDown();

    // 🛍️ Item
    doc.fontSize(14).text("Item:", { underline: true });
    doc
      .fontSize(12)
      .text(
        `${order.product?.name || "Unknown Product"} - ₹${order.totalPrice} × ${
          order.qty
        } = ₹${order.totalPrice * order.qty}`
      );

    doc.moveDown();
    doc
      .fontSize(14)
      .text(`Total Price: ₹${order.totalPrice}`, { align: "right" });

    doc.end();
  } catch (err) {
    console.error("Invoice generation error:", err);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
});

module.exports = router;
