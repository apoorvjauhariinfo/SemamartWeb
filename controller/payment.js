const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const CheckoutSession = require("../model/checkoutSession");

const router = express.Router();

// ✅ Hardcoded test keys
const razorpay = new Razorpay({
  key_id: "rzp_test_RP4Pp63egmufYa",
  key_secret: "efhwya6a7Ph1wZU4neOd3Q90",
});

// Create Razorpay order
router.post("/order", async (req, res) => {
  try {
    const { amount } = req.body;
    const options = {
      amount: amount * 100, // convert to paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Verify Razorpay payment
router.post("/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderIds } = req.body;

    const hmac = crypto.createHmac("sha256", "efhwya6a7Ph1wZU4neOd3Q90");
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // ✅ Update all split orders with same payment info
    const Order = require("../model/order");
    await Order.updateMany(
      { _id: { $in: orderIds } },
      {
        $set: {
          "paymentInfo.id": razorpay_payment_id,
          "paymentInfo.status": "Paid",
          "paymentInfo.method": "Razorpay",
          paidAt: new Date(),
        },
      }
    );

    res.json({ success: true, message: "Payment verified and orders updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// HDFC SmartGateway webhook
router.post("/hdfc/webhook", async (req, res) => {
  try {
    const payload = req.body || {};
    const orderId =
      payload.order_id ||
      payload.orderId ||
      payload?.order?.order_id ||
      payload?.order?.orderId;
    const status = payload.status || payload?.order?.status;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Missing order_id" });
    }

    if (status === "CHARGED") {
      const Order = require("../model/order");
      const now = new Date();

      await Order.updateMany(
        { "paymentInfo.groupId": orderId, status: "Created" },
        {
          $set: {
            status: "Paid",
            paidAt: now,
            "paymentInfo.status": "Paid",
            "paymentInfo.transactionId": payload.id || payload.txn_id || undefined,
          },
          $push: { statusHistory: { status: "Paid", updatedAt: now } },
        },
      );
    }

    const checkoutSession = await CheckoutSession.findOne({
      paymentGroupId: orderId,
    });
    if (checkoutSession && checkoutSession.status !== "ORDER_CREATED") {
      checkoutSession.hdfcStatus = status || null;
      checkoutSession.paymentId = payload.id || payload.txn_id || null;
      if (status === "CHARGED") {
        checkoutSession.status = "CHARGED";
      } else if (status) {
        checkoutSession.status = "FAILED";
      }
      await checkoutSession.save();
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
