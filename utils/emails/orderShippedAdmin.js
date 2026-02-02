// utils/emails/sendOrderShippedAdminEmail.js
const sentMailToAdmin = require("../mailToAdmin");
const orderShippedAdminTemplate = require("./templates/orderShippedAdmin");

const sendOrderShippedAdminEmail = async ({
  orderId,
  instituteName,
  trackingNumber, // Added
  carrierName,    // Added (logisticPartner)
}) => {
  const html = orderShippedAdminTemplate({
    orderId,
    instituteName,
    trackingNumber, // Pass to template
    carrierName,    // Pass to template
    bannerImageUrl: "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521670/order-shipped-admin_ipira8.png",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  });

  await sentMailToAdmin(
    `Order Shipped – ${orderId}`,
    html
  );
};

module.exports = sendOrderShippedAdminEmail;