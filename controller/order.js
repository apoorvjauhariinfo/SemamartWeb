const express = require("express");
const path = require("path")
const mongoose = require("mongoose");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const Order = require("../model/order");
const Shop = require("../model/shop");
const User = require("../model/user");
const { Product } = require("../model/product");
const PDFDocument = require("pdfkit");
const { uploadV2 } = require("../multer");
const sentMailToAdmin = require("../utils/mailToAdmin");
function getMonthDateRange(year, monthIndex) {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

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
          variant: item.variantId,
          qty: item.qty,
          shippingAddress,
          user,
          totalPrice: item.totalPrice, // ✅ use per-item totalPrice
          tax: item.tax,
          unitPrice: item.unitPrice,
          paymentInfo,
          statusHistory: [{ status: "Created", updatedAt: new Date() }],
        });
        orders.push(order);
      }
      const orderIdsHtml = orders
        .map(
          (order) => `
            <p style="margin: 5px 0;">
              <strong>Order ID:</strong> ${order._id}
            </p>
          `
        )
        .join("");
      const mailSubject = "New Orders Created"
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h2 style="color: #2c3e50;">New Orders</h2>
          <p>New orders with following order ids are created.</p>
          <div style="margin-top: 20px; padding: 15px; background: #f7f7f7; border-left: 4px solid #3498db;">
          ${orderIdsHtml}
          </div>
        </div>
      `;

      await sentMailToAdmin(mailSubject,htmlBody)
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
      "variants name manufacturerName"
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
    const order = await Order.findById(req.params.orderId)
      .populate({
        path: "variant",
        populate: {
          path: "productId",
          select: "name",
        },
      })
      .select("-shippingAddress");

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
        .populate({
          path: "variant",
          populate: {
            path: "productId",
            select: "name images variants", // fetch product details through variant
          },
        })
        .populate("shop", "name email")
        .populate("user", "firstName lastName email phoneNumber addresses");

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
      const orders = await Order.find({ shop: req.params.shopId, status: { $nin: ["Created", "Paid"] }, })
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
      const order = await Order.findById(req.params.id).populate("variant");

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      if (req.body.status === "Transferred to delivery partner") {
        await updateStock(order.variant.productId, order.qty);
      }

      order.status = req.body.status;
      order.statusHistory.push({
        status: req.body.status,
        updatedAt: new Date(),
      });

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
        .select("-shippingAddress -paymentInfo")
        .populate("user", "firstName lastName")
        .populate("shop", "businessName")
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, orders });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.get(
  "/get-order-details-admin/:orderId",
  isAuthenticated,
  isAdmin("Admin"),
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

router.put(
  "/update-order-status-admin/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) throw new ErrorHandler("Order not found", 404);

    order.status = req.body.status;
    order.statusHistory.push({
      status: req.body.status,
      updatedAt: new Date(),
    });

    await order.save();
    res.status(201).json(order);
  })
);

router.put(
  "/update-order-payment/:id",
  uploadV2.single("payment_file"),
  catchAsyncErrors(async (req,res)=>{
    const order = await Order.findById(req.params.id);
    if (!order) throw new ErrorHandler("Order not found", 404);
    if(order.paymentFile) throw new ErrorHandler("Payment verification still pending", 402)
    order.paymentFile=req.file.filename
    order.status="Paid"
    await order.save()

    const mailSubject = "Payment Receipt Added"
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <h2 style="color: #2c3e50;">Payment Receipt uploaded</h2>
        <p>New Payment receipt has been uploaded by customer for order: ${order._id}.</p>
      </div>
    `;
    await sentMailToAdmin(mailSubject,htmlBody)

    res.status(200).json(order)
  })
)

router.put(
  "/update-tracking-details/:id",
  isSeller,
  catchAsyncErrors(async (req, res) => {
    const { id } = req.params;
    const { logisticPartner, trackingNumber, pickupPerson, pickupPersonPhone } =
      req.body;

    if (!logisticPartner || !trackingNumber) {
      throw new ErrorHandler("Bad Request", 402);
    }

    const order = await Order.findById(id);
    if (!order) {
      throw new ErrorHandler("Order not found", 404);
    }

    order.trackingDetails = {
      logisticPartner,
      trackingNumber,
      pickupPerson,
      pickupPersonPhone,
    };

    await order.save();

    res.status(200).json({
      success: true,
      message: "Tracking details updated successfully",
      order,
    });
  })
);

// ✅ Generate invoice per order
// Utility to write bold label + normal value on the same line
function labeledText(doc, label, value, x, y) {
  doc.fontSize(10).font("Helvetica-Bold").text(label, x, y);
  const labelWidth = doc.widthOfString(label);
  doc.font("Helvetica").text(value, x + labelWidth + 2, y);
}
router.get("/invoice/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId)
      .populate({
        path: "variant",
        populate: {
          path: "productId",
          select: "name hsn"
        },
      })
      .populate("user")
      .populate("shop");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const doc = new PDFDocument({ size: "A4", margin: 20 });
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${orderId}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    const logoPath = path.join(__dirname, "../assets/Logo-imag.png");
    doc.image(logoPath, 50, 25, { width: 70 });
    doc.moveDown(3);

    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown();

    // ===== SELLER & BUYER INFO SIDE BY SIDE =====
    let startY = doc.y; // capture current Y position

    // Seller info (Left side)
    let sellerY = startY;
    labeledText(doc, "Seller: ", order.shop.businessName, 50, sellerY);
    sellerY += 14;

    labeledText(doc, "GSTIN: ", order.shop.gstNumber || "N/A", 50, sellerY);
    sellerY += 14;

    labeledText(
      doc,
      "Invoice Date: ",
      new Date(order.createdAt).toLocaleDateString("en-IN"),
      50,
      sellerY
    );
    sellerY += 14;

    labeledText(
      doc,
      "Invoice No: ",
      `INV-${orderId.slice(-6).toUpperCase()}`,
      50,
      sellerY
    );


    // Buyer info (Right side)
    const buyerX = 400;
    let buyerY = startY;

    labeledText(doc, "Buyer: ", order.user?.instituteName || "N/A", buyerX, buyerY);
    buyerY += 14;

    labeledText(doc, "Shipping Address: ", "", buyerX, buyerY);
    buyerY += 14;

    doc
      .text(
        `${order.shippingAddress?.instituteAddress1 || ""}`,
        buyerX,
        buyerY
      );
    buyerY += 14;

    doc
      .text(
        order.shippingAddress?.instituteAddress2 || "",
        buyerX,
        buyerY
      );
    buyerY += 14;

    doc
      .text(
        `${order.shippingAddress?.district || ""}, ${order.shippingAddress?.state || ""}, ${order.shippingAddress?.pincode || ""}`,
        buyerX,
        buyerY
      );
    buyerY += 14;

    labeledText(
      doc,
      "Landmark: ",
      order.shippingAddress?.landmark || "N/A",
      buyerX,
      buyerY
    );

    doc.moveDown(2);

    const startX = 20;
    startY = doc.y + 5;

    // Column widths (Description, HSN, Qty, Rate, Tax, Total)
    const colWidths = [200, 80, 60, 80, 60, 80];
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const rowHeight = 25;

    // Table headers
    const headers = ["Description", "HSN", "Qty", "Rate", "Tax", "Total"];

    // Sample data (you can add more items easily)
    const items = [
      {
        description: order.variant.productId?.name || "N/A",
        hsn: order.variant.productId?.hsn || "N/A",
        qty: order.qty || 1,
        rate: order.unitPrice || 0,
        tax: order.tax,
        total: order.totalPrice || 0,
      },
    ];

    // Calculate total table height (header + rows)
    const totalRows = items.length + 1; // +1 for header
    const tableHeight = totalRows * rowHeight;

    // Draw vertical grid lines (spanning entire table)
    let x = startX;
    doc.strokeColor("#000").lineWidth(0.5);
    doc
      .moveTo(x, startY)
      .lineTo(x, startY + tableHeight)
      .stroke();
    colWidths.forEach((w) => {
      x += w;
      doc
        .moveTo(x, startY)
        .lineTo(x, startY + tableHeight)
        .stroke();
    });

    // Draw header background
    doc.rect(startX, startY, tableWidth, rowHeight).fill("#f0f0f0").stroke();
    doc.fillColor("#000").font("Helvetica-Bold").fontSize(11);

    // Draw header text
    x = startX;
    headers.forEach((header, i) => {
      doc.text(header, x + 5, startY + 7, {
        width: colWidths[i] - 10,
        align: "center",
      });
      x += colWidths[i];
    });

    doc
      .moveTo(startX, startY)
      .lineTo(startX + tableWidth, startY )
      .stroke();
    let headerX = startX;
    colWidths.forEach((w) => {
      doc
        .moveTo(headerX, startY)
        .lineTo(headerX, startY + rowHeight)
        .stroke();
      headerX += w;
    });
    doc
      .moveTo(headerX, startY)
      .lineTo(headerX, startY + rowHeight)
      .stroke();

    // Horizontal line below header
    doc
      .moveTo(startX, startY + rowHeight)
      .lineTo(startX + tableWidth, startY + rowHeight)
      .stroke();

    startY += rowHeight;

    // Draw data rows
    doc.font("Helvetica").fontSize(10).fillColor("#000");

    items.forEach((item, rowIndex) => {
      x = startX;
      const y = startY + rowIndex * rowHeight;
      const cells = [
        item.description,
        item.hsn,
        item.qty.toString(),
        item.rate.toFixed(2),
        item.tax + " %",
        item.total.toFixed(2),
      ];
      const heights = cells.map((cell, i) =>
        doc.heightOfString(cell, { width: colWidths[i] - 10 })
      );
      const cellHeight = Math.max(...heights, rowHeight) + 15;

      // Draw vertical borders for this row
      let lineX = startX;
      for (let i = 0; i <= colWidths.length; i++) {
        doc
          .moveTo(lineX, y)
          .lineTo(lineX, y + cellHeight)
          .stroke();
        if (i < colWidths.length) lineX += colWidths[i];
      }

      // Draw bottom horizontal border
      doc
        .moveTo(startX, y + cellHeight)
        .lineTo(startX + tableWidth, y + cellHeight)
        .stroke();

      // Draw text inside each cell
      x = startX;
      cells.forEach((cell, i) => {
        doc.text(cell, x + 5, y + 7, {
          width: colWidths[i] - 10,
          align: i >= 2 ? "right" : "left",
        });
        x += colWidths[i];
      });
    });

    doc.end();
  } catch (err) {
    console.error("Invoice generation error:", err);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
});

router.get(
  "/admin-dashboard-summary",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const now = new Date();
      const year = now.getFullYear();

      // Helper to get start and end of month
      function getMonthDateRange(year, monthIndex) {
        const start = new Date(year, monthIndex, 1);
        const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
        return { start, end };
      }

      // Calculate start/end dates for current and last month
      const startOfThisMonth = new Date(year, now.getMonth(), 1);
      const startOfLastMonth = new Date(year, now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(year, now.getMonth(), 0, 23, 59, 59, 999);

      // --- Vendors ---
      const newVendorsCount = await Shop.countDocuments({
        createdAt: { $gte: startOfThisMonth },
      });

      const lastMonthVendorsCount = await Shop.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      });

      let vendorTrend = 0;
      if (lastMonthVendorsCount > 0) {
        vendorTrend =
          ((newVendorsCount - lastMonthVendorsCount) / lastMonthVendorsCount) *
          100;
      } else if (newVendorsCount > 0) {
        vendorTrend = 100;
      }

      const totalVendorsCount = await Shop.countDocuments();

      // --- Institutes (Users) ---
      const newInstitutesCount = await User.countDocuments({
        createdAt: { $gte: startOfThisMonth },
      });

      const lastMonthInstitutesCount = await User.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      });

      let instituteTrend = 0;
      if (lastMonthInstitutesCount > 0) {
        instituteTrend =
          ((newInstitutesCount - lastMonthInstitutesCount) /
            lastMonthInstitutesCount) *
          100;
      } else if (newInstitutesCount > 0) {
        instituteTrend = 100;
      }

      const totalInstitutesCount = await User.countDocuments();

      // --- Orders ---
      const newOrdersCount = await Order.countDocuments({
        createdAt: { $gte: startOfThisMonth },
      });

      const lastMonthOrdersCount = await Order.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      });

      let orderTrend = 0;
      if (lastMonthOrdersCount > 0) {
        orderTrend =
          ((newOrdersCount - lastMonthOrdersCount) / lastMonthOrdersCount) *
          100;
      } else if (newOrdersCount > 0) {
        orderTrend = 100;
      }

      const totalOrdersCount = await Order.countDocuments();

      // Aggregate monthly orders count for the last 12 months (including this month)
      const monthsToFetch = 12;
      const monthlyOrders = [];

      for (let i = monthsToFetch - 1; i >= 0; i--) {
        const { start, end } = getMonthDateRange(year, now.getMonth() - i);
        const count = await Order.countDocuments({
          createdAt: { $gte: start, $lte: end },
        });
        const monthName = start.toLocaleString("default", { month: "short" });
        monthlyOrders.push({ month: monthName, orders: count });
      }

      res.status(200).json({
        success: true,
        data: {
          newVendors: newVendorsCount,
          vendors: totalVendorsCount,
          vendorTrend: vendorTrend.toFixed(1),

          newInstitutes: newInstitutesCount,
          institutes: totalInstitutesCount,
          instituteTrend: instituteTrend.toFixed(1),

          newOrders: newOrdersCount,
          orders: totalOrdersCount,
          orderTrend: orderTrend.toFixed(1),

          monthlyOrders,
        },
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.put("/add-order-payment",
  catchAsyncErrors(async(req,res)=>{
    res.send("nnnn")
  })
)

module.exports = router;
