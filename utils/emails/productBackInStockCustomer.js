const sendMail = require("../sendMail");
const productBackInStockCustomerTemplate =
  require("./templates/productBackInStockCustomer");

const sendProductBackInStockCustomerEmail = async ({
  customerEmail,
  customerName,
  products,
}) => {
  const html = productBackInStockCustomerTemplate({
    customerName,
    products,
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521668/back-in-stock-customer_ycaslp.png",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  });

  await sendMail({
    email: customerEmail,
    subject: "Product Back in Stock – Order Now",
    html,
  });
};

module.exports = sendProductBackInStockCustomerEmail;
