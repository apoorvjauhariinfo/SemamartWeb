const sendMail = require("../sendMail");
const verifyPaymentCustomerTemplate =
  require("./templates/verifyPaymentCustomer");

const sendVerifyPaymentCustomerEmail = async ({
  customerEmail,
  customerName,
  orderId,
  items,
  totalAmount,
}) => {
  const html = verifyPaymentCustomerTemplate({
    customerName,
    orderId,
    items,
    totalAmount,
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521672/verify-payment-customer_olso4h.png",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  });

  await sendMail({
    email: customerEmail,
    subject: `Payment Verification Required – Order #${orderId}`,
    html,
  });
};

module.exports = sendVerifyPaymentCustomerEmail;
