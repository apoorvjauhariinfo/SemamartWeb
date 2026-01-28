const sentMailToAdmin = require("../mailToAdmin");
const verifyPaymentAdminTemplate =
  require("./templates/verifyPaymentAdmin");

const sendVerifyPaymentAdminEmail = async ({
  customerName,
  orderId,
  items,
  totalAmount,
  paymentMethod,
}) => {
  const html = verifyPaymentAdminTemplate({
    customerName,
    orderId,
    items,
    totalAmount,
    paymentMethod,
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521672/verify-payment-admin_d532in.png",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  });

  await sentMailToAdmin(
    `Payment Received – Verify Order #${orderId}`,
    html
  );
};

module.exports = sendVerifyPaymentAdminEmail;
