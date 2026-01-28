const sentMailToAdmin = require("../mailToAdmin");
const orderDeliveredAdminTemplate =
  require("./templates/orderDeliveredAdmin");

const sendOrderDeliveredAdminEmail = async ({
  orderId,
  instituteName,
}) => {
  const html = orderDeliveredAdminTemplate({
    orderId,
    instituteName,
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521668/order-delivered-admin_rscyvn.png",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  });

  // ✅ TEMPLATE OUTPUT PASSED DIRECTLY
  await sentMailToAdmin(
    `Order Delivered – ${orderId}`,
    html
  );
};

module.exports = sendOrderDeliveredAdminEmail;
