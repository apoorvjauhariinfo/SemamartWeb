const sentMailToAdmin = require("../mailToAdmin");
const bulkOrderRequestAdminTemplate =
  require("./templates/bulkOrderRequestAdmin");

const sendBulkOrderRequestAdminEmail = async ({
  instituteName,
  instituteEmail,
  institutePhone,
  products,
  notes,
}) => {
  const html = bulkOrderRequestAdminTemplate({
    instituteName,
    instituteEmail,
    institutePhone,
    products,
    notes,
    bannerImageUrl:
      "https://res.cloudinary.com/deom4dy3l/image/upload/v1769521669/bulk-order-admin_tjryug.png",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  });

  await sentMailToAdmin(
    "New Bulk Order Request Received",
    html
  );
};

module.exports = sendBulkOrderRequestAdminEmail;
