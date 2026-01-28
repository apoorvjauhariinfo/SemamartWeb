const sentMailToAdmin = require("../mailToAdmin");
const template = require("./templates/newSellerAdminVerify");

const sendNewSellerAdminVerifyEmail = async ({
  sellerName,
  sellerEmail,
}) => {
  const html = template({
    sellerName,
    sellerEmail,
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521671/verify-new-seller_iox67r.png",
  });

  await sentMailToAdmin(
    "New Seller Pending Verification",
    html
  );
};

module.exports = sendNewSellerAdminVerifyEmail;
