const sendMail = require("../sendMail");
const productOutOfStockSellerTemplate =
  require("./templates/productOutOfStockSeller");

const sendProductOutOfStockSellerEmail = async ({
  sellerEmail,
  sellerName,
  products,
}) => {
  const html = productOutOfStockSellerTemplate({
    sellerName,
    products,
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521671/product-out-of-stock-seller_f7b4rr.png",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  });

  await sendMail({
    email: sellerEmail,
    subject: "Product Out of Stock – Action Required",
    html,
  });
};

module.exports = sendProductOutOfStockSellerEmail;
