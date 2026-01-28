const sendMail = require("../sendMail");
const template = require("./templates/selfVerifySeller");

module.exports = async ({ sellerEmail, sellerName, verificationToken }) => {
  const verificationLink = `${
    process.env.FRONTEND_URL || "http://localhost:5173"
  }/seller/activation/${verificationToken}`;

  const html = template({
    sellerName,
    verificationLink,
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521672/verify-seller_fdteiv.png",
  });

  await sendMail({
    email: sellerEmail,
    subject: "Verify your seller email – Semamart",
    html,
  });
};
