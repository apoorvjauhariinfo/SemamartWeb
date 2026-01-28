const sentMailToAdmin = require("../mailToAdmin");
const orderShippedAdminTemplate =
  require("./templates/orderShippedAdmin");

const sendOrderShippedAdminEmail = async ({
  orderId,
  instituteName,
}) => {
  const html = orderShippedAdminTemplate({
    orderId,
    instituteName,
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521670/order-shipped-admin_ipira8.pn",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  });

  // ✅ Template output passed directly
  await sentMailToAdmin(
    `Order Shipped – ${orderId}`,
    html
  );
};

module.exports = sendOrderShippedAdminEmail;
