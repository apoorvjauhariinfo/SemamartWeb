const sentMailToAdmin = require("../mailToAdmin");
const newInstituteRegisteredAdminTemplate =
  require("./templates/newInstituteRegisteredAdmin");

const sendNewInstituteRegisteredAdminEmail = async ({
  instituteName,
  instituteEmail,
  institutePhone,
}) => {
  const html = newInstituteRegisteredAdminTemplate({
    instituteName,
    instituteEmail,
    institutePhone,
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521669/new-institute-registered_x8buwk.png",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  });

  await sentMailToAdmin(
    "New Institute Registration – Semamart",
    html
  );
};

module.exports = sendNewInstituteRegisteredAdminEmail;
