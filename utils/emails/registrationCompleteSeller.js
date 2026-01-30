const sendMail = require("../sendMail");
const template = require("./templates/registrationCompleteSeller");

module.exports = async ({
  sellerEmail,
  sellerName,
}) => {
  const html = template({
    sellerName,
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521669/welcome-seller_jjc1yr.png",
  });

  await sendMail({
    email: sellerEmail,
    subject: "Your seller account is approved 🎉",
    html,
  });
};
