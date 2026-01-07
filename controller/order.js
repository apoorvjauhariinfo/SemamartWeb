const express = require("express");
const path = require("path");
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
const sendMail = require("../utils/sendMail");
const fs = require("fs");
const { generateInvoice } = require("../utils/pdfGeneration");
const { nanoid } = require("nanoid");

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
            const paymentGroupId = nanoid(20)

            const {
                cart,
                shippingAddress,
                user,
                totalPrice,
                paymentInfo,
                paymentMethod,
            } = req.body;
            if (!cart || cart.length === 0) {
                return next(new ErrorHandler("Cart is empty", 400));
            }

            if (!paymentMethod) {
                throw new ErrorHandler("Method type required", 401);
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
                    statusHistory: [
                        { status: "Created", updatedAt: new Date() },
                    ],

                    paymentInfo: {
                        method: paymentMethod,
                        // status: "PENDING",
                        id: paymentGroupId,
                        groupId: paymentGroupId,
                    },
                });
                orders.push(order);
            }

            const orderIdsHtml = orders
                .map(
                    (order) => `
            <p style="margin: 5px 0;">
              <strong>Order ID:</strong> ${order._id}
            </p>
          `,
                )
                .join("");
            const mailSubject = "New Orders Created";
            const htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h2 style="color: #2c3e50;">New Orders</h2>
          <p>New orders with following order ids are created.</p>
          <div style="margin-top: 20px; padding: 15px; background: #f7f7f7; border-left: 4px solid #3498db;">
          ${orderIdsHtml}
          </div>
        </div>
      `;

            // await sentMailToAdmin(mailSubject, htmlBody);
            res.status(201).json({
                success: true,
                orders,
                paymentMethod,
                paymentGroupId,
            });
        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    }),
);

router.post(
    "/create-payment-session",
    catchAsyncErrors(async (req, res) => {
        const { paymentGroupId } = req.body;

        if (!paymentGroupId) {
            throw new ErrorHandler("paymentGroupId is required", 400);
        }

        const orders = await Order.find({
            "paymentInfo.groupId": paymentGroupId,
        });
        if (!orders || orders.length === 0) {
            throw new ErrorHandler(
                "No orders found for this payment group",
                404,
            );
        }

        const totalAmount = orders.reduce(
            (sum, order) => sum + order.totalPrice,
            0,
        );

        const hdfcPayload = {
            merchant_id: process.env.HDFC_MERCHANT_ID,
            order_id: paymentGroupId,
            amount: totalAmount,
            currency: "INR",
            payment_page_client_id: process.env.HDFC_PAYMENT_PAGE_CLIENT_ID,
            return_url:
                process.env.HDFC_RETURN_URL_BASE + "/payment/" + paymentGroupId,
        };

        const hdfcResponse = await fetch(process.env.BASE_URL + "/session", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${process.env.BASE_64_API}`,
            },
            body: JSON.stringify(hdfcPayload),
        });

        const hdfcResponseData = await hdfcResponse.json();
        const paymentSessionId = hdfcResponseData.id;
        const paymentLink = hdfcResponseData.payment_links.web;

        if (!paymentSessionId || !paymentLink) {
            throw new ErrorHandler();
        }

        res.status(200).json({
            success: true,
            paymentSessionId,
            paymentLink,
        });
    }),
);

router.get(
    "/order-confirmation/:orderId",
    catchAsyncErrors(async (req, res) => {
        const { orderId } = req.params;
        const url = `https://smartgateway.hdfcuat.bank.in/orders/${orderId}`;

        const hdfcResponse = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${process.env.BASE_64_API}`,
            },
        });

        if (!hdfcResponse.ok) {
            throw new ErrorHandler("Something went wrong", 500);
        }

        const hdfcData = await hdfcResponse.json();

        if (hdfcData.status === "CHARGED") {
            await Order.updateMany(
                {
                    "paymentInfo.groupId": orderId,
                    status: "Created",
                },
                {
                    $set: {
                        status: "Paid",
                        paidAt: new Date(),
                    },
                    $push: {
                        statusHistory: {
                            status: "Paid",
                            updatedAt: new Date(),
                        },
                    },
                },
            );

            // STEP 2: Paid → Processing
            await Order.updateMany(
                {
                    "paymentInfo.groupId": orderId,
                    status: "Paid",
                },
                {
                    $set: {
                        status: "Processing",
                    },
                    $push: {
                        statusHistory: {
                            status: "Processing",
                            updatedAt: new Date(),
                        },
                    },
                },
            );
        }

        return res.status(200).json({
            success: true,
            status: hdfcData.status,
            orderId: hdfcData.order_id,
            paymentId: hdfcData.id,
        });
    }),
);

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
                .populate("shop", "name email")
                .populate(
                    "user",
                    "firstName lastName email phoneNumber addresses",
                );

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
                .populate(
                    "user",
                    "firstName lastName email phoneNumber addresses",
                );

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
                status: { $nin: ["Created", "Paid"] },
            })
                .select("-shippingAddress -paymentInfo")
                .populate("user", "firstName lastName")
                .populate({
                    path: "variant",
                    populate: { path: "productId", select: "name" },
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
            const order = await Order.findById(req.params.id).populate(
                "variant",
            );

            if (!order) {
                return next(
                    new ErrorHandler("Order not found with this id", 400),
                );
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
                await updateSellerInfo(
                    order.shop,
                    order.totalPrice - serviceCharge,
                );
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
                    seller.availableBalance =
                        (seller.availableBalance || 0) + amount;
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
                return next(
                    new ErrorHandler("Order not found with this id", 400),
                );
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
                return next(
                    new ErrorHandler("Order not found with this id", 400),
                );
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
                .select("-shippingAddress -paymentInfo")
                .populate("user", "firstName lastName")
                .populate("shop", "businessName")
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

        await order.save();
        if (order.status === "Processing") {
            const email = order.shop.email;
            const subject = "New Order";
            const htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-width: 600px; margin: auto;">
          <h2 style="color: #2c3e50; margin-bottom: 10px;">
            New Order Received
          </h2>
          <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid #27ae60;">
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Product Name:</strong> ${order.variant.productId.name}</p>
            <p><strong>Quantity:</strong> ${order.qty}</p>
            <p><strong>Unit Price:</strong> ₹${order.unitPrice}</p>
            <p><strong>Tax:</strong> ₹${order.tax}</p>
            <p><strong>Total Amount:</strong> <strong>₹${order.totalPrice}</strong></p>
          </div>
        </div>
      `;
            await sendMail({ email, subject, html: htmlBody });
            const customerMail = order.user.email;
            const customerMailSubject = "Order Payment Verified";
            const customerMailBody = `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-width: 600px; margin: auto;">
          <p style="font-size: 15px;">
            We’re happy to inform you that the payment for your order has been
            <strong>successfully verified by our admin team</strong>.
          </p>
          <div style="margin-top: 20px; padding: 15px; background: #f7f7f7; border-left: 4px solid #27ae60;">
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Total Amount Paid:</strong> ₹${order.totalPrice}</p>
          </div>
        </div>
      `;
            await sendMail({
                email: customerMail,
                subject: customerMailSubject,
                html: customerMailBody,
            });
        }
        if (order.status === "Delivered") {
            const email = order.shop.email;
            const subject = "Order Delivered Successfully";
            const htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-width: 600px; margin: auto;">
          <h2 style="color: #2c3e50; margin-bottom: 10px;">
            Following Order is successfully delivered to the customer
          </h2>
          <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid #27ae60;">
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Product Name:</strong> ${order.variant.productId.name}</p>
            <p><strong>Quantity:</strong> ${order.qty}</p>
            <p><strong>Unit Price:</strong> ₹${order.unitPrice}</p>
            <p><strong>Tax:</strong> ₹${order.tax}</p>
            <p><strong>Total Amount:</strong> <strong>₹${order.totalPrice}</strong></p>
          </div>
        </div>
      `;
            await sendMail({ email, subject, html: htmlBody });
            const customerMail = order.user.email;
            const customerMailSubject = "Order Delivered Successfully";
            const customerMailBody = `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-width: 600px; margin: auto;">
          <h2 style="color: #2c3e50; margin-bottom: 10px;">
            Following Order is successfully delivered.
          </h2>
          <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid #27ae60;">
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Product Name:</strong> ${order.variant.productId.name}</p>
            <p><strong>Quantity:</strong> ${order.qty}</p>
            <p><strong>Unit Price:</strong> ₹${order.unitPrice}</p>
            <p><strong>Tax:</strong> ₹${order.tax}</p>
            <p><strong>Total Amount:</strong> <strong>₹${order.totalPrice}</strong></p>
          </div>
        </div>
      `;
            await sendMail({
                email: customerMail,
                subject: customerMailSubject,
                html: customerMailBody,
            });
        }
        res.status(201).json({ success: true });
    }),
);

router.put(
    "/update-order-payment/:id",
    uploadV2.single("payment_file"),
    catchAsyncErrors(async (req, res) => {
        const order = await Order.findById(req.params.id);
        if (!order) throw new ErrorHandler("Order not found", 404);
        if (order.paymentFile)
            throw new ErrorHandler("Payment verification still pending", 402);
        order.paymentFile = req.file.filename;
        order.status = "Paid";
        order.statusHistory.push({
            status: "Paid",
            updatedAt: new Date(),
        });
        await order.save();

        const mailSubject = "Payment Receipt Added";
        const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <h2 style="color: #2c3e50;">Payment Receipt uploaded</h2>
        <p>New Payment receipt has been uploaded by customer for order: ${order._id}.</p>
      </div>
    `;
        await sentMailToAdmin(mailSubject, htmlBody);

        res.status(200).json(order);
    }),
);

router.put(
    "/update-tracking-details/:id",
    isSeller,
    uploadV2.single("tracking_file"),
    catchAsyncErrors(async (req, res) => {
        const { id } = req.params;
        const {
            logisticPartner,
            trackingNumber,
            pickupPerson,
            pickupPersonPhone,
        } = req.body;

        if (!logisticPartner || !trackingNumber) {
            throw new ErrorHandler("Bad Request", 402);
        }

        const order = await Order.findById(id).populate("user");
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
        const mailSubject = "Order tracking details added";
        const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <h2 style="color: #2c3e50;">Order tracking details uploaded</h2>
        <p>Tracking details uploaded by seller for order: ${order._id}.</p>
      </div>
    `;
        const customerEmail = order.user.email;
        await sendMail({
            email: customerEmail,
            subject: mailSubject,
            html: htmlBody,
        });

        res.status(200).json({
            success: true,
            message: "Tracking details updated successfully",
            order,
        });
    }),
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

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=invoice-${orderId}.pdf`,
        );
        res.setHeader("Content-Type", "application/pdf");
        generateInvoice(res, order);
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
            const endOfLastMonth = new Date(
                year,
                now.getMonth(),
                0,
                23,
                59,
                59,
                999,
            );

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
                    ((newVendorsCount - lastMonthVendorsCount) /
                        lastMonthVendorsCount) *
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
                    ((newOrdersCount - lastMonthOrdersCount) /
                        lastMonthOrdersCount) *
                    100;
            } else if (newOrdersCount > 0) {
                orderTrend = 100;
            }

            const totalOrdersCount = await Order.countDocuments();

            // Aggregate monthly orders count for the last 12 months (including this month)
            const monthsToFetch = 12;
            const monthlyOrders = [];

            for (let i = monthsToFetch - 1; i >= 0; i--) {
                const { start, end } = getMonthDateRange(
                    year,
                    now.getMonth() - i,
                );
                const count = await Order.countDocuments({
                    createdAt: { $gte: start, $lte: end },
                });
                const monthName = start.toLocaleString("default", {
                    month: "short",
                });
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

module.exports = router;
