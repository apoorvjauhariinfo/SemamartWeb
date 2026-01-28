const sendMail = require("../sendMail");
const selfVerifyCustomerTemplate = require("./templates/selfVerifyCustomer");

const sendSelfVerifyCustomerEmail = async ({
  customerEmail,
  customerName,
  verificationToken,
}) => {
  const verificationLink = `${
    process.env.FRONTEND_URL || "http://localhost:5173"
  }/user/activation/${verificationToken}`;

  const html = selfVerifyCustomerTemplate({
    customerName,
    verificationLink,
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521671/verify-customer_vlzqjw.png",
  });

  await sendMail({
    email: customerEmail,
    subject: "Verify your email address – Semamart",
    html,
  });
};

module.exports = sendSelfVerifyCustomerEmail;
