const sendMail = require("../sendMail");
const orderPlacedCustomerTemplate = require("./templates/orderPlacedCustomer.js");

const sendOrderPlacedCustomerEmail = async ({
  customerEmail,
  customerName,
  orderId,
  productName,
  qty,
  totalAmount,
}) => {
  const html = orderPlacedCustomerTemplate({
    customerName,
    orderId,
    productName,
    qty,
    totalAmount,
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521670/order-received-customer_pn4bag.png",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  });

  await sendMail({
    email: customerEmail,
    subject: `Order Placed Successfully – Order #${orderId}`,
    html,
  });
};

module.exports = sendOrderPlacedCustomerEmail;
