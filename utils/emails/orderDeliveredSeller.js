const sendMail = require("../sendMail");
const orderDeliveredSellerTemplate =
  require("./templates/orderDeliveredSeller");

const sendOrderDeliveredSellerEmail = async ({
  sellerEmail,
  sellerName,
  orderId,
  items,
  totalAmount,
}) => {
  const html = orderDeliveredSellerTemplate({
    sellerName,
    orderId,
    items,
    totalAmount,
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521670/order-delivered-seller_uyaodo.png",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  });

  await sendMail({
    email: sellerEmail,
    subject: `Order Delivered – Order #${orderId}`,
    html,
  });
};

module.exports = sendOrderDeliveredSellerEmail;
