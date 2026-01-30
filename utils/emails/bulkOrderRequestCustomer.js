const sendMail = require("../sendMail");
const bulkOrderRequestCustomerTemplate =
  require("./templates/bulkOrderRequestCustomer");

const sendBulkOrderRequestCustomerEmail = async ({
  customerEmail,
  customerName,
  products,
  notes,
}) => {
  const html = bulkOrderRequestCustomerTemplate({
    customerName,
    products,
    notes,
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521668/bulk-order-customer_tzfqvs.png",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  });

  await sendMail({
    email: customerEmail,
    subject: "Bulk Order Request Received – Semamart",
    html,
  });
};

module.exports = sendBulkOrderRequestCustomerEmail;
