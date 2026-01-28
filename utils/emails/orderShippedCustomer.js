const sendMail = require("../sendMail");
const orderShippedCustomerTemplate =
  require("./templates/orderShippedCustomer");

const sendOrderShippedCustomerEmail = async ({
  customerEmail,
  customerName,
  orderId,
  productName,
  qty,
  totalAmount,
}) => {
  const html = orderShippedCustomerTemplate({
    customerName,
    orderId,
    productName,
    qty,
    totalAmount,
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521671/order-shipped-customer_rplnbc.png",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  });

  await sendMail({
    email: customerEmail,
    subject: `Your Order Has Been Shipped – Order #${orderId}`,
    html,
  });
};

module.exports = sendOrderShippedCustomerEmail;
