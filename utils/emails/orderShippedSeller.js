const sendMail = require("../sendMail");
const orderShippedSellerTemplate =
  require("./templates/orderShippedSeller");

const sendOrderShippedSellerEmail = async ({
  sellerEmail,
  sellerName,
  orderId,
  productName,
  qty,
  totalAmount,
}) => {
  const html = orderShippedSellerTemplate({
    sellerName,
    orderId,
    productName,
    qty,
    totalAmount,
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521670/order-shipped-seller_bzmems.png",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  });

  await sendMail({
    email: sellerEmail,
    subject: `Order Shipped Successfully – Order #${orderId}`,
    html,
  });
};

module.exports = sendOrderShippedSellerEmail;
