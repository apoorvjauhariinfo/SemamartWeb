const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const Order = require("../model/order");
const CheckoutSession = require("../model/checkoutSession");
const Shop = require("../model/shop");
const User = require("../model/user");
const { Product, ProductVariant } = require("../model/product");
const PDFDocument = require("pdfkit");
const { uploadV2 } = require("../multer");
const sentMailToAdmin = require("../utils/mailToAdmin");
const sendOrderPlacedCustomerEmail = require("../utils/emails/orderPlacedCustomer");
const sendOrderDeliveredCustomerEmail = require("../utils/emails/orderDeliveredCustomer");
const sendOrderDeliveredSellerEmail = require("../utils/emails/orderDeliveredSeller");
const sendOrderShippedAdminEmail = require("../utils/emails/orderShippedAdmin");
const sendOrderDeliveredAdminEmail = require("../utils/emails/orderDeliveredAdmin");
const sendOrderReceivedAdminEmail = require("../utils/emails/orderReceivedAdmin");
const sendOrderShippedCustomerEmail = require("../utils/emails/orderShippedCustomer");
const sendOrderReceivedSellerEmail = require("../utils/emails/orderReceivedSeller");
const sendOrderShippedSellerEmail = require("../utils/emails/orderShippedSeller");
const sendVerifyPaymentCustomerEmail = require("../utils/emails/verifyPaymentCustomer");
const sendVerifyPaymentAdminEmail = require("../utils/emails/verifyPaymentAdmin");
const crypto = require("crypto");

const generateOrderPdf = require("../utils/generateOrderPdf");
const sendMail = require("../utils/sendMail");
const fs = require("fs");
const { generateInvoice } = require("../utils/pdfGeneration");
//console.log("generateOrderPdf type:", typeof generateOrderPdf);

function getMonthDateRange(year, monthIndex) {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function generatePaymentGroupId() {
  // 20-char, non-sequential, alphanumeric (hex) id
  return crypto.randomBytes(10).toString("hex");
}

function resolveHdfcReturnBase() {
  const candidates = [process.env.HDFC_RETURN_URL_BASE, process.env.FRONTEND_URL];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const raw = candidate.trim();
    if (!raw) continue;
    if (/port\s*=|port%20=/i.test(raw)) continue;

    try {
      const parsed = new URL(raw);
      if (/comport/i.test(parsed.hostname)) continue;
      return parsed.origin;
    } catch (e) {
      continue;
    }
  }

  return "https://semamart.com";
}

async function fetchHdfcOrderStatus(orderId) {
  const url = `${process.env.BASE_URL}/orders/${orderId}`;
  const hdfcResponse = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${process.env.BASE_64_API}`,
    },
  });

  if (!hdfcResponse.ok) {
    throw new ErrorHandler("Failed to fetch HDFC order status", 502);
  }

  return hdfcResponse.json();
}

async function markGroupPaid(orderId, transactionId) {
  const now = new Date();

  await Order.updateMany(
    {
      "paymentInfo.groupId": orderId,
      status: "Created",
    },
    {
      $set: {
        status: "Paid",
        paidAt: now,
        "paymentInfo.status": "Paid",
        "paymentInfo.transactionId": transactionId || undefined,
      },
      $push: {
        statusHistory: { status: "Paid", updatedAt: now },
      },
    },
  );
}

async function appendPaymentAttemptToGroup(orderId, hdfcData) {
  const status = hdfcData?.status || "UNKNOWN";
  const paymentId = hdfcData?.id || hdfcData?.txn_id || null;
  const message =
    hdfcData?.resp_message ||
    hdfcData?.bank_error_message ||
    hdfcData?.error_message ||
    "";

  const attemptPayload = {
    attemptedAt: new Date(),
    gateway: "HDFC",
    status,
    paymentId,
    orderGroupId: orderId,
    message,
    responseSnapshot: hdfcData,
  };

  const query = paymentId
    ? {
        "paymentInfo.groupId": orderId,
        paymentAttempts: {
          $not: { $elemMatch: { paymentId, status } },
        },
      }
    : { "paymentInfo.groupId": orderId };

  await Order.updateMany(query, {
    $push: { paymentAttempts: attemptPayload },
    $set: {
      "paymentInfo.transactionId": paymentId || undefined,
      "paymentInfo.status": status === "CHARGED" ? "Paid" : "Failed",
    },
  });
}

async function createOrdersForCheckout({
  cart,
  shippingAddress,
  user,
  paymentInfo,
  paymentMethod,
}) {
  const userDoc = await User.findById(user);
  if (!userDoc) throw new ErrorHandler("User not found", 404);
  if (!cart || cart.length === 0) throw new ErrorHandler("Cart is empty", 400);

  const resolvedPaymentMethod =
    paymentMethod || paymentInfo?.method || "Manual";
  const useHdfc =
    typeof resolvedPaymentMethod === "string" &&
    ["hdfc", "online"].includes(resolvedPaymentMethod.toLowerCase());
  const paymentGroupId = useHdfc
    ? paymentInfo?.groupId || generatePaymentGroupId()
    : null;

  const orders = [];
  const itemsForAdmin = [];

  for (const item of cart) {
    const variant = await ProductVariant.findById(item.variantId).populate(
      "productId",
    );

    if (!variant) {
      throw new ErrorHandler(`Variant not found for item: ${item.name}`, 404);
    }

    const variantLabel = [variant.size, variant.colorOption]
      .filter(Boolean)
      .join(" / ");

    if (variant.stock < item.qty) {
      throw new ErrorHandler(
        `Insufficient stock for ${variant.productId.name}${variantLabel ? ` (${variantLabel})` : ""}`,
        400,
      );
    }

    variant.stock -= item.qty;
    await variant.save();

    let cgst = false;
    let sgst = false;
    let igst = false;
    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    const defaultAddress = userDoc.addresses?.[0];
    const userState = defaultAddress?.state;
    const TAX_RATE = item.tax;

    if (userState === "Delhi") {
      cgst = true;
      sgst = true;
      cgstRate = TAX_RATE / 2;
      sgstRate = TAX_RATE / 2;
      cgstAmount = ((item.discounted_price || 0) * cgstRate) / 100 * item.qty;
      sgstAmount = ((item.discounted_price || 0) * sgstRate) / 100 * item.qty;
    } else {
      igst = true;
      igstAmount = ((item.discounted_price || 0) * TAX_RATE) / 100 * item.qty;
    }

    const order = await Order.create({
      shop: item.shopId,
      variant: item.variantId,
      qty: item.qty,
      shippingAddress,
      user,
      totalPrice: item.totalPrice,
      tax: item.tax,
      unitPrice: item.unitPrice,
      paymentInfo: {
        ...paymentInfo,
        method: resolvedPaymentMethod,
        status: paymentInfo?.status || "Pending",
        id: paymentGroupId || paymentInfo?.id || "pending",
        groupId: paymentGroupId || paymentInfo?.groupId,
      },
      statusHistory: [{ status: "Created", updatedAt: new Date() }],
      dispatchState: item.dispatchState,
      dispatchDistrict: item.dispatchDistrict,
      adminCommision: item.adminCommision,
      sellerPayout: item.sellerPayout,
      cgst,
      sgst,
      igst,
      cgst_rate: cgstRate,
      sgst_rate: sgstRate,
      igst_rate: igstRate,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      igst_amount: igstAmount,
      discounted_amount: item.discounted_price || 0,
    });

    orders.push(order);

    sendOrderPlacedCustomerEmail({
      customerEmail: userDoc.email,
      customerName: userDoc.firstName,
      orderId: order._id,
      productName: variant.productId.name,
      qty: item.qty,
      totalAmount: item.totalPrice,
    }).catch((err) => console.error("Email Error:", err));

    itemsForAdmin.push({
      name: variant.productId.name,
      quantity: item.qty,
      price: item.unitPrice,
    });
  }

  const totalAmount = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  const adminInstituteName =
    userDoc.instituteName || `${userDoc.firstName} ${userDoc.lastName}`;

  sendOrderReceivedAdminEmail({
    orderId: orders.map((o) => o._id).join(", "),
    instituteName: adminInstituteName,
    items: itemsForAdmin,
    totalAmount,
  }).catch((err) => console.error("Admin Email Error:", err));

  return {
    orders,
    paymentMethod: resolvedPaymentMethod,
    paymentGroupId,
  };
}

async function syncHdfcPaymentAndOrders(orderId) {
  const hdfcData = await fetchHdfcOrderStatus(orderId);
  let checkoutSession = await CheckoutSession.findOne({
    paymentGroupId: orderId,
  });

  if (hdfcData?.status === "CHARGED") {
    if (checkoutSession && checkoutSession.status !== "ORDER_CREATED") {
      const created = await createOrdersForCheckout({
        cart: checkoutSession.cart,
        shippingAddress: checkoutSession.shippingAddress,
        user: checkoutSession.user,
        paymentInfo: {
          id: orderId,
          groupId: orderId,
          method: "HDFC",
          status: "Paid",
          transactionId: hdfcData?.id,
        },
        paymentMethod: "HDFC",
      });

      const paidAt = new Date();
      await Order.updateMany(
        { _id: { $in: created.orders.map((o) => o._id) } },
        {
          $set: {
            status: "Paid",
            paidAt,
            "paymentInfo.status": "Paid",
            "paymentInfo.transactionId": hdfcData?.id,
          },
          $push: {
            statusHistory: { status: "Paid", updatedAt: paidAt },
          },
        },
      );

      checkoutSession.status = "ORDER_CREATED";
      checkoutSession.hdfcStatus = hdfcData?.status;
      checkoutSession.paymentId = hdfcData?.id || null;
      checkoutSession.createdOrderIds = created.orders.map((o) => o._id);
      await checkoutSession.save();
      await appendPaymentAttemptToGroup(orderId, hdfcData);
    } else {
      await markGroupPaid(orderId, hdfcData?.id);
      await appendPaymentAttemptToGroup(orderId, hdfcData);
    }
  } else if (checkoutSession && checkoutSession.status !== "ORDER_CREATED") {
    const created = await createOrdersForCheckout({
      cart: checkoutSession.cart,
      shippingAddress: checkoutSession.shippingAddress,
      user: checkoutSession.user,
      paymentInfo: {
        id: orderId,
        groupId: orderId,
        method: "HDFC",
        status: "Failed",
        transactionId: hdfcData?.id,
      },
      paymentMethod: "HDFC",
    });

    checkoutSession.status = "ORDER_CREATED";
    checkoutSession.hdfcStatus = hdfcData?.status || "FAILED";
    checkoutSession.errorMessage = hdfcData?.resp_message || "Payment failed";
    checkoutSession.paymentId = hdfcData?.id || null;
    checkoutSession.createdOrderIds = created.orders.map((o) => o._id);
    await checkoutSession.save();
    await appendPaymentAttemptToGroup(orderId, hdfcData);
  } else {
    await appendPaymentAttemptToGroup(orderId, hdfcData);
  }

  const orders = await Order.find({
    $or: [
      { "paymentInfo.groupId": orderId },
      ...(checkoutSession?.createdOrderIds?.length
        ? [{ _id: { $in: checkoutSession.createdOrderIds } }]
        : []),
    ],
  }).select("totalPrice");

  const totalAmount = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  const finalAmount = totalAmount || checkoutSession?.totalPrice || 0;

  return {
    status: hdfcData?.status,
    orderId: hdfcData?.order_id || orderId,
    paymentId: hdfcData?.id,
    amount: finalAmount,
    orderCreated: checkoutSession?.status === "ORDER_CREATED" || orders.length > 0,
  };
}

// ✅ Create new order(s)
// router.post(
//   "/create-order",
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { cart, shippingAddress, user, totalPrice, paymentInfo } = req.body;
//       const userDoc = await User.findById(user);

//       if (!userDoc) {
//         return next(new ErrorHandler("User not found", 404));
//       }

//       if (!cart || cart.length === 0) {
//         return next(new ErrorHandler("Cart is empty", 400));
//       }

//       const orders = [];

//       // 🔥 Split each cart item into its own order
//       for (const item of cart) {
//         const variant = await ProductVariant.findById(item.variantId).populate(
//           "productId",
//           "name"
//         );

//         const variantLabel = [variant.size, variant.colorOption]
//           .filter(Boolean)
//           .join(" / ");

//         if (variant.stock < item.qty) {
//           return next(
//             new ErrorHandler(
//               `Insufficient stock for ${variant.productId.name}${
//                 variantLabel ? ` (${variantLabel})` : ""
//               }`,
//               400
//             )
//           );
//         }

//         variant.stock -= item.qty;
//         await variant.save();
//         const order = await Order.create({
//           shop: item.shopId,
//           variant: item.variantId,
//           qty: item.qty,
//           shippingAddress,
//           user,
//           totalPrice: item.totalPrice, // ✅ use per-item totalPrice
//           tax: item.tax,
//           unitPrice: item.unitPrice,
//           paymentInfo,
//           statusHistory: [{ status: "Created", updatedAt: new Date() }],
//         });
//         orders.push(order);
//         await sendOrderPlacedCustomerEmail({
//           customerEmail: userDoc.email,
//           customerName: userDoc.firstName,
//           orderId: order._id,
//           productName: variant.productId.name,
//           qty: item.qty,
//           totalAmount: item.totalPrice,
//         });
//       }
//       const items = orders.map((order) => ({
//         orderId: order._id,
//         quantity: order.qty,
//         unitPrice: order.unitPrice,
//         totalPrice: order.totalPrice,
//       }));

//       const totalAmount = orders.reduce(
//         (sum, order) => sum + order.totalPrice,
//         0
//       );

//       const adminInstituteName = userDoc.instituteName || `${userDoc.firstName} ${userDoc.lastName}`;

//       await sendOrderReceivedAdminEmail({
//         orderId: orders.map((o) => o._id).join(", "),
//         instituteName: adminInstituteName,
//         items: itemsForAdmin,
//         totalAmount,
//       });

//       res.status(201).json({ success: true, orders });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

router.get(
  "/get-order-details/:orderId",
  catchAsyncErrors(async (req, res) => {
    const order = await Order.findById(req.params.orderId).populate(
      "cart.productId",
      "variants name manufacturerName",
    );

    if (!order) {
      res.status(404).send("Order not Found");
    }

    res.json(order);
  }),
);

router.post(
  "/create-order",
  catchAsyncErrors(async (req, res, next) => {
    const { cart, shippingAddress, user, paymentInfo, paymentMethod, totalPrice } = req.body;
    const isHdfcCreate =
      typeof paymentMethod === "string" &&
      ["hdfc", "online"].includes(paymentMethod.toLowerCase());

    // Backward compatible path: old frontend calls create-order first for HDFC.
    // We create only a checkout session here; actual orders are created post-payment success.
    if (isHdfcCreate && !paymentInfo?.groupId) {
      if (!cart || !shippingAddress || !user) {
        throw new ErrorHandler("Incomplete HDFC checkout payload", 400);
      }
      const paymentGroupId = generatePaymentGroupId();
      await CheckoutSession.create({
        paymentGroupId,
        cart,
        shippingAddress,
        user,
        totalPrice,
        paymentMethod: "HDFC",
        status: "PENDING",
      });

      return res.status(201).json({
        success: true,
        orders: [],
        paymentMethod: "HDFC",
        paymentGroupId,
        deferredOrderCreation: true,
      });
    }

    const result = await createOrdersForCheckout({
      cart,
      shippingAddress,
      user,
      paymentInfo,
      paymentMethod,
    });

    res.status(201).json({
      success: true,
      ...result,
    });
  }),
);

router.post(
  "/create-payment-session",
  catchAsyncErrors(async (req, res) => {
    let selectedOrderIds =
      req.body?.orderIds ?? req.body?.selectedOrderIds ?? null;

    if (typeof selectedOrderIds === "string") {
      try {
        const parsed = JSON.parse(selectedOrderIds);
        selectedOrderIds = Array.isArray(parsed) ? parsed : [selectedOrderIds];
      } catch (e) {
        selectedOrderIds = selectedOrderIds
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
      }
    }

    if (!Array.isArray(selectedOrderIds)) {
      selectedOrderIds = [];
    }

    const {
      paymentGroupId,
      orderId,
      cart,
      shippingAddress,
      user,
      totalPrice,
    } = req.body;

    let groupId = paymentGroupId;
    let checkoutSession = null;
    let totalAmount = 0;
    let customer = null;

    if (
      !groupId &&
      selectedOrderIds.length > 0
    ) {
      const uniqueOrderIds = [...new Set(selectedOrderIds)];
      const orders = await Order.find({
        _id: { $in: uniqueOrderIds },
      }).populate("user", "email phoneNumber");

      if (!orders || orders.length === 0) {
        throw new ErrorHandler("No orders found for selected ids", 404);
      }

      const sameUser = orders.every(
        (o) => String(o.user?._id || o.user) === String(orders[0].user?._id || orders[0].user),
      );
      if (!sameUser) {
        throw new ErrorHandler("Selected orders must belong to one user", 400);
      }

      groupId = generatePaymentGroupId();

      await Order.updateMany(
        { _id: { $in: uniqueOrderIds } },
        {
          $set: {
            "paymentInfo.groupId": groupId,
            "paymentInfo.id": groupId,
            "paymentInfo.method": "HDFC",
            "paymentInfo.status": "Pending",
          },
        },
      );

      totalAmount = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      customer = orders[0]?.user;
    }

    if (!groupId && orderId) {
      const order = await Order.findById(orderId);
      if (!order) throw new ErrorHandler("Order not found", 404);

      if (!order.paymentInfo?.groupId) {
        groupId = generatePaymentGroupId();
        await Order.updateOne(
          { _id: orderId },
          {
            $set: {
              "paymentInfo.groupId": groupId,
              "paymentInfo.id": groupId,
              "paymentInfo.method": "HDFC",
              "paymentInfo.status": "Pending",
            },
          },
        );
      } else {
        groupId = order.paymentInfo.groupId;
      }
    }

    if (!groupId && cart && shippingAddress && user) {
      groupId = generatePaymentGroupId();
      checkoutSession = await CheckoutSession.create({
        paymentGroupId: groupId,
        cart,
        shippingAddress,
        user,
        totalPrice,
        paymentMethod: "HDFC",
        status: "PENDING",
      });
    }

    if (!groupId) {
      throw new ErrorHandler(
        "paymentGroupId, orderId, orderIds, or checkout payload is required",
        400,
      );
    }

    if (!checkoutSession) {
      checkoutSession = await CheckoutSession.findOne({
        paymentGroupId: groupId,
      });
    }

    if (!checkoutSession) {
      const orders = await Order.find({
        "paymentInfo.groupId": groupId,
      }).populate("user", "email phoneNumber");

      if (!orders || orders.length === 0) {
        throw new ErrorHandler("No orders found for this payment group", 404);
      }

      totalAmount = orders.reduce((sum, order) => sum + order.totalPrice, 0);
      customer = orders[0]?.user;
    } else {
      totalAmount = checkoutSession.totalPrice;
      customer = await User.findById(checkoutSession.user).select(
        "email phoneNumber",
      );
    }

    const customerId =
      customer?._id?.toString?.() || groupId || generatePaymentGroupId();

    const hdfcPayload = {
      merchant_id: process.env.HDFC_MERCHANT_ID,
      order_id: groupId,
      amount: totalAmount,
      currency: "INR",
      payment_page_client_id: process.env.HDFC_PAYMENT_PAGE_CLIENT_ID,
      return_url: `${resolveHdfcReturnBase()}/api/v2/order/hdfc/return`,
      customer_id: customerId,
      customer_email: customer?.email,
      customer_phone: customer?.phoneNumber,
    };

    const hdfcResponse = await fetch(`${process.env.BASE_URL}/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${process.env.BASE_64_API}`,
      },
      body: JSON.stringify(hdfcPayload),
    });

    const hdfcResponseData = await hdfcResponse.json();
    const paymentSessionId = hdfcResponseData.id;
    const paymentLink = hdfcResponseData?.payment_links?.web;

    if (!paymentSessionId || !paymentLink) {
      throw new ErrorHandler("Invalid HDFC session response", 502);
    }

    if (checkoutSession) {
      checkoutSession.hdfcSessionId = paymentSessionId;
      checkoutSession.hdfcStatus = "PENDING";
      await checkoutSession.save();
    }

    res.status(200).json({
      success: true,
      paymentSessionId,
      paymentLink,
      paymentGroupId: groupId,
    });
  }),
);

router.get(
  "/order-confirmation/:orderId",
  catchAsyncErrors(async (req, res) => {
    const { orderId } = req.params;
    const result = await syncHdfcPaymentAndOrders(orderId);

    return res.status(200).json({
      success: true,
      ...result,
    });
  }),
);

router.all(
  "/hdfc/return",
  catchAsyncErrors(async (req, res) => {
    const orderId =
      req.query?.order_id ||
      req.query?.orderId ||
      req.body?.order_id ||
      req.body?.orderId ||
      req.body?.id;

    const frontendBase = resolveHdfcReturnBase();

    if (!orderId) {
      return res.redirect(`${frontendBase}/checkout?payment=hdfc&status=failed`);
    }

    try {
      const result = await syncHdfcPaymentAndOrders(orderId);
      if (result.status === "CHARGED" && result.orderCreated) {
        return res.redirect(
          `${frontendBase}/payment/hdfc/return?order_id=${encodeURIComponent(orderId)}&status=success`,
        );
      }
      return res.redirect(
        `${frontendBase}/payment/hdfc/return?order_id=${encodeURIComponent(orderId)}&status=failed`,
      );
    } catch (error) {
      return res.redirect(
        `${frontendBase}/payment/hdfc/return?order_id=${encodeURIComponent(orderId)}&status=failed`,
      );
    }
  }),
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
  }),
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
            select: "name images variants manufacturerName ", // fetch product details through variant
          },
        })
        .populate("shop", "name email businessName")
        .populate("user", "firstName lastName email phoneNumber addresses");

      res.status(200).json({ success: true, orders });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }),
);

router.get(
  "/get-order/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order id",
        });
      }

      const order = await Order.findById(id)
        .populate({
          path: "variant",
          populate: {
            path: "productId",
            select: "name images manufacturerName",
          },
        })
        .populate("shop", "name email")
        .populate("user", "firstName lastName email phoneNumber addresses");

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      res.status(200).json({
        success: true,
        order,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }),
);

// ✅ Get all orders of a seller
router.get(
  "/get-seller-all-orders/:shopId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find({
        shop: req.params.shopId,
      })
        .select("-shippingAddress -paymentInfo")
        .populate("user", "firstName lastName instituteName")
        .populate({
          path: "variant",
          populate: { path: "productId", select: "name commission" },
        })
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, orders });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }),
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
  }),
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
  }),
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
  }),
);

// ✅ Admin: get all orders
router.get(
  "/admin-all-orders",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find()
        .select("-shippingAddress")
        .populate("user", "firstName lastName instituteName")
        .populate("shop", "businessName")
        .populate({
          path: "variant",
          populate: {
            path: "productId",
            select: "name commission",
          },
        })
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, orders });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }),
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
  }),
);

router.put(
  "/update-order-status-admin/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res) => {
    const { status } = req.body;
    const order = await Order.findById(req.params.id)
      .populate("shop")
      .populate("user")
      .populate({
        path: "variant",
        populate: {
          path: "productId",
        },
      });

    if (!order) throw new ErrorHandler("Order not found", 404);
    if (
      !order.shop ||
      !order.variant ||
      !order.variant.productId ||
      !order.user
    ) {
      throw new ErrorHandler("Invalid order", 404);
    }

    order.status = req.body.status;
    order.statusHistory.push({
      status: req.body.status,
      updatedAt: new Date(),
    });

    if (req.body.status === "Processing") {
      order.paymentInfo = order.paymentInfo || {};
      order.paymentInfo.status = "Paid";
    }

    if (status === "Delivered") order.deliveredAt = Date.now();

    await order.save();

    // Helper variables to prevent 'undefined' in emails
    const productName = order.variant?.productId?.name || "Product";
    const customerName = order.user?.firstName || "Customer";
    const sellerName = order.shop?.businessName || order.shop?.name || "Seller";

    if (order.status === "Processing") {
      await sendOrderReceivedSellerEmail({
        sellerEmail: order.shop?.email,
        sellerName,
        orderId: order._id,
        productName,
        qty: order.qty,
        unitPrice: order.unitPrice,
        tax: order.tax,
        totalAmount: order.totalPrice,
        frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
      }).catch(e => console.log("Mail Error:", e));
    }

    if (order.status === "Delivered") {
      await sendOrderDeliveredAdminEmail({
        orderId: order._id,
        instituteName:
          order.user.instituteName ||
          `${order.user.firstName} ${order.user.lastName}`,
      });
    }
    if (order.status === "Delivered") {
      await sendOrderDeliveredCustomerEmail({
        customerEmail: order.user.email,
        customerName: customerName,
        orderId: order._id,
        totalAmount: order.totalPrice,
      }).catch(e => console.log("Mail Error:", e));
    }

    if (order.status === "Delivered") {
      // Map the order data to the structure the template expects
      const itemsArray = [{
        name: order.variant?.productId?.name || "Product",
        quantity: order.qty,
        price: order.unitPrice
      }];

      await sendOrderDeliveredSellerEmail({
        sellerEmail: order.shop?.email,
        sellerName: order.shop?.businessName || "Seller",
        orderId: order._id,
        items: itemsArray,
        totalAmount: order.totalPrice,
      }).catch(e => console.log("Delivered Seller Mail Error:", e));
    }
    res.status(201).json({ success: true });
  }),
);

router.put(
  "/update-order-payment/:id",
  uploadV2.single("payment_file"),
  catchAsyncErrors(async (req, res) => {
    console.log("🔥 update-order-payment HIT");

    if (!req.file) throw new ErrorHandler("No payment file uploaded", 400);

    const order = await Order.findById(req.params.id)
      .populate("user")
      .populate({
        path: "variant",
        populate: { path: "productId" },
      });

    if (!order) throw new ErrorHandler("Order not found", 404);

    const customerName = order.user
      ? `${order.user.firstName} ${order.user.lastName}`
      : "Customer";
    const instituteName = order.user?.instituteName || "Not Provided";
    const productName = order.variant?.productId?.name || "Product";

    const items = [
      {
        name: productName,
        quantity: order.qty,
        price: order.unitPrice,
        totalPrice: order.totalPrice,
      },
    ];

    order.paymentFile = req.file.filename;
    order.status = "Paid";
    order.paidAt = new Date();

    order.statusHistory.push({
      status: "Paid",
      updatedAt: new Date(),
    });

    await order.save();
    console.log("✅ Order saved:", order._id);

    // existing verify-payment emails
    await sendVerifyPaymentAdminEmail({
      customerName: instituteName, // This fixes the "Submitted by" line
      orderId: order._id,
      items,
      totalAmount: order.totalPrice,
      paymentMethod: order.paymentInfo?.method || "Manual Transfer",
    });

    await sendVerifyPaymentCustomerEmail({
      customerEmail: order.user.email,
      customerName: customerName,
      orderId: order._id,
      items,
      totalAmount: order.totalPrice,
    });

    // ---- FORCE populate for PDF ----
    const populated = await Order.findById(order._id)
      .populate("user")
      .populate({
        path: "variant",
        populate: { path: "productId" },
      })
      .populate("shop");

    console.log("🔥 Populated order ready for PDF");

    // ---- Generate invoice ----
    let invoicePath = null;
    try {
      invoicePath = await generateOrderPdf(populated);
      console.log("🔥 Invoice generated:", invoicePath);
    } catch (e) {
      console.error("❌ Invoice generation failed:", e);
    }

    if (invoicePath) {
      populated.invoicePdf = invoicePath;
      await populated.save();
      console.log("✅ invoicePdf saved to DB");
    }

    const finalOrder = await Order.findById(order._id)
      .populate("user")
      .populate({
        path: "variant",
        populate: { path: "productId" },
      })
      .populate("shop");

    console.log("🔥 FINAL invoicePdf:", finalOrder.invoicePdf);

    return res.status(200).json(finalOrder);
  }),
);

router.put(
  "/update-order-payment-bulk",
  uploadV2.single("payment_file"),
  catchAsyncErrors(async (req, res) => {
    if (!req.file) throw new ErrorHandler("No payment file uploaded", 400);

    let ids = req.body.orderIds;
    if (typeof ids === "string") {
      try {
        ids = JSON.parse(ids);
      } catch (e) {
        ids = [ids];
      }
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ErrorHandler("orderIds is required", 400);
    }

    const objectIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (objectIds.length === 0) {
      throw new ErrorHandler("No valid order ids provided", 400);
    }

    const now = new Date();
    const updateResult = await Order.updateMany(
      { _id: { $in: objectIds } },
      {
        $set: {
          paymentFile: req.file.filename,
          status: "Paid",
          paidAt: now,
          "paymentInfo.method": "Manual",
          "paymentInfo.status": "Pending",
        },
        $push: {
          statusHistory: {
            status: "Paid",
            updatedAt: now,
          },
        },
      },
    );

    return res.status(200).json({
      success: true,
      matchedCount: updateResult.matchedCount || 0,
      modifiedCount: updateResult.modifiedCount || 0,
    });
  }),
);

router.put(
  "/update-tracking-details/:id",
  isSeller,
  uploadV2.single("tracking_file"),
  catchAsyncErrors(async (req, res) => {
    const { id } = req.params;
    const { logisticPartner, trackingNumber, pickupPerson, pickupPersonPhone } =
      req.body;

    if (!logisticPartner || !trackingNumber) {
      throw new ErrorHandler("Bad Request", 402);
    }

    const order = await Order.findById(id)
    .populate("user")
    .populate("shop")
    .populate({
      path: "variant",
      populate: { path: "productId" },
    });
    if (!order) {
      throw new ErrorHandler("Order not found", 404);
    }
    if (!order.user) {
      throw new ErrorHandler("Order not valid", 404);
    }

    const trackingFile = req.file ? req.file.filename : undefined;

    order.trackingDetails = {
      ...order.trackingDetails,
      logisticPartner,
      trackingNumber,
      pickupPerson,
      pickupPersonPhone,
    };

    if (trackingFile) {
      if (order.trackingDetails.trackingDocument) {
        const docPath = path.join(
          process.cwd(),
          "uploads",
          "payment-docs",
          order.trackingDetails.trackingDocument,
        );
        if (fs.existsSync(docPath)) {
          fs.unlinkSync(docPath);
        }
      }
      order.trackingDetails.trackingDocument = trackingFile;
    }

    await order.save();
    // 3. Prepare placeholders
    const productName = order.variant?.productId?.name || "Product";
    const customerName = order.user?.firstName || "Customer";
    const sellerName = order.shop?.businessName || order.shop?.name || "Seller";

    // To SELLER (Their Confirmation)
    await sendOrderShippedSellerEmail({
      sellerEmail: order.shop?.email,
      sellerName,
      orderId: order._id,
      productName,
      qty: order.qty,
      totalAmount: order.totalPrice,
      logisticPartner,
      trackingNumber,
    }).catch(e => console.log("Seller Mail Error:", e));

    // To Customer (Includes Tracking Info)
    await sendOrderShippedCustomerEmail({
      customerEmail: order.user.email,
      customerName: customerName,
      orderId: order._id,
      productName,
      qty: order.qty,
      totalAmount: order.totalPrice,
      logisticPartner, // Pass these to your email template!
      trackingNumber,
    }).catch(e => console.log("Mail Error:", e));

    // To Admin
    await sendOrderShippedAdminEmail({
      orderId: order._id,
      instituteName: order.user?.instituteName || "Client",
      trackingNumber: trackingNumber, // From req.body
      carrierName: logisticPartner,   // From req.body
    }).catch(e => console.log("Mail Error:", e));

    res.status(200).json({
      success: true,
      message: "Order marked as Shipped and tracking updated",
      order,
    });
  })
  //   const mailSubject = "Order tracking details added";
  //   const htmlBody = `
  //     <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
  //       <h2 style="color: #2c3e50;">Order tracking details uploaded</h2>
  //       <p>Tracking details uploaded by seller for order: ${order._id}.</p>
  //     </div>
  //   `;
  //   const customerEmail = order.user.email;
  //   await sendMail({
  //     email: customerEmail,
  //     subject: mailSubject,
  //     html: htmlBody,
  //   });

  //   res.status(200).json({
  //     success: true,
  //     message: "Tracking details updated successfully",
  //     order,
  //   });
  // }),
);

// ✅ Generate invoice per order


router.get("/invoice/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId)
      .populate({
        path: "variant",
        populate: {
          path: "productId",
          select: "name hsn",
        },
      })
      .populate("user")
      .populate("shop");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // 🔥 Generate PDF file (your function already does this)
    const relativePath = await generateOrderPdf(order);

    const absolutePath = path.join(
      process.cwd(),
      "uploads",
      relativePath
    );

    // 🔥 Send file as download
    return res.download(
      absolutePath,
      `invoice-${orderId}.pdf`
    );
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
  }),
);

router.put(
  "/add-order-payment",
  catchAsyncErrors(async (req, res) => {
    res.send("nnnn");
  }),
);

router.get(
  "/seller-dashboard-stats",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const shopId = req.seller._id;

    const result = await Order.aggregate([
      { $match: { shop: shopId, status: "Delivered" } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalPrice" },
          deliveredOrders: { $sum: 1 },
        },
      },
    ]);

    const stats = result[0] || {
      totalSales: 0,
      deliveredOrders: 0,
    };

    res.status(200).json({
      success: true,
      totalSales: stats.totalSales,
      deliveredOrders: stats.deliveredOrders,
    });
  }),
);

router.get(
  "/get-seller-delivered-orders",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const shopId = req.seller._id;

    const orders = await Order.find({
      shop: shopId,
      status: "Delivered",
    })
      .select("-shippingAddress -paymentInfo")
      .populate("user", "firstName lastName instituteName")
      .populate({
        path: "variant",
        populate: { path: "productId", select: "name commission" },
      })
      .sort({ deliveredAt: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  }),
);

module.exports = router;

