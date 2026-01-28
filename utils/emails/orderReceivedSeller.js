const sendMail = require("../sendMail");
const orderReceivedSellerTemplate = require("./templates/orderReceivedSeller");

const sendOrderReceivedSellerEmail = async ({
  sellerEmail,
  sellerName,
  orderId,
  productName,
  qty,
  totalAmount,
}) => {
  const html = orderReceivedSellerTemplate({
    sellerName,
    orderId,
    productName,
    qty,
    totalAmount,
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521670/order-received-seller_cz6u5o.png",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  });

  await sendMail({
    email: sellerEmail,
    subject: `New Order Received – Order #${orderId}`,
    html,
  });
};

module.exports = sendOrderReceivedSellerEmail;
