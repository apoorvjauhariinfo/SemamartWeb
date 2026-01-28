const sentMailToAdmin = require("../mailToAdmin");
const template = require("./templates/orderReceivedAdmin");

const sendOrderReceivedAdminEmail = async ({
  adminEmail,
  orderId,
  instituteName,
  items,
  totalAmount,
}) => {
  const html = template({
    orderId,
    instituteName,
    items,
    totalAmount,
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521670/order-received-Admin_ggoswi.png",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  });

  // ✅ TEMPLATE OUTPUT PASSED DIRECTLY
await sentMailToAdmin(
    `New Order Received – ${orderId}`,
    html
  );
};

module.exports = sendOrderReceivedAdminEmail;
