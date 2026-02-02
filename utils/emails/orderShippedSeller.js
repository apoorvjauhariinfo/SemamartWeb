// utils/emails/sendOrderShippedSellerEmail.js
const sendMail = require("../sendMail");
const orderShippedSellerTemplate = require("./templates/orderShippedSeller");

const sendOrderShippedSellerEmail = async ({
  sellerEmail,
  sellerName,
  orderId,
  productName,
  qty,
  totalAmount,
  logisticPartner, // Added
  trackingNumber,  // Added
}) => {
  const html = orderShippedSellerTemplate({
    sellerName,
    orderId,
    productName,
    qty,
    totalAmount,
    logisticPartner, // Pass to template
    trackingNumber,  // Pass to template
    bannerImageUrl: "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521670/order-shipped-seller_bzmems.png",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  });

  await sendMail({
    email: sellerEmail,
    subject: `Order Shipped Successfully – Order #${orderId}`,
    html,
  });
};

module.exports = sendOrderShippedSellerEmail;