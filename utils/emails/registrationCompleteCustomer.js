const sendMail = require("../sendMail");
const registrationCompleteCustomerTemplate =
  require("./templates/registrationCompleteCustomer");

const sendRegistrationCompleteCustomerEmail = async ({
  customerEmail,
  customerName,
}) => {
  const html = registrationCompleteCustomerTemplate({
    customerName,
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521669/welcome-customer_uo2ahr.png",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  });

  await sendMail({
    email: customerEmail,
    subject: "Your Semamart account is now active 🎉",
    html,
  });
};

module.exports = sendRegistrationCompleteCustomerEmail;
