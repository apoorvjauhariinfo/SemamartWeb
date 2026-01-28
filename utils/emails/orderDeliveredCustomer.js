const sendMail = require("../sendMail");
const orderDeliveredCustomerTemplate =
  require("./templates/orderDeliveredCustomer");

const sendOrderDeliveredCustomerEmail = async ({
  customerEmail,
  customerName,
  orderId,
  totalAmount,
}) => {
  const html = orderDeliveredCustomerTemplate({
    customerName,
    orderId,
    totalAmount,
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521669/order-delivered-customer_ovdeue.png",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  });

  await sendMail({
    email: customerEmail,
    subject: `Your Order Has Been Delivered – Order #${orderId}`,
    html,
  });
};

module.exports = sendOrderDeliveredCustomerEmail;
