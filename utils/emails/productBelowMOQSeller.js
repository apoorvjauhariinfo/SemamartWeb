const sendMail = require("../sendMail");
const productBelowMOQSellerTemplate =
  require("./templates/productBelowMOQSeller");

const sendProductBelowMOQSellerEmail = async ({
  sellerEmail,
  sellerName,
  products,
}) => {
  const html = productBelowMOQSellerTemplate({
    sellerName,
    products,
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521671/product-below-MOQ-seller_wykkrr.png",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  });

  await sendMail({
    email: sellerEmail,
    subject: "Low Stock Alert – Action Recommended",
    html,
  });
};

module.exports = sendProductBelowMOQSellerEmail;
