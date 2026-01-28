// utils/emails/templates/registrationCompleteSeller.js
const baseLayout = require("../layouts/baseLayout");

const registrationCompleteSellerTemplate = ({
  sellerName,
  frontendUrl,
  bannerImageUrl,
}) => {
  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom: 32px;">
          <img
            src="${bannerImageUrl}"
            alt="Seller Account Approved"
            width="800"
            style="width: 100%; max-width: 800px; border-radius: 12px; display: block;"
          />
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      Seller account approved 🎉
    </h2>

    <p style="margin: 0 0 24px; font-size: 16px; color: #2a2a2e; line-height: 1.6;">
      Hi ${sellerName || "Seller"},<br/><br/>
      Congratulations! Your seller account has been successfully verified and approved by the <strong>Semamart</strong> team. 
      You are now officially part of our marketplace.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin: 24px 0;">
      <tr>
        <td style="padding: 24px;">
          <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6;">
            You can now start listing your products, managing your inventory, and fulfilling orders directly from your dashboard. We look forward to seeing your business grow!
          </p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
      <tr>
        <td align="left">
          <table cellpadding="0" cellspacing="0" style="border-collapse: separate;">
            <tr>
              <td align="center" bgcolor="#16a34a" style="border-radius: 8px;">
                <a
                  href="${frontendUrl}/seller/dashboard"
                  target="_blank"
                  style="
                    display: inline-block;
                    padding: 16px 32px;
                    font-size: 16px;
                    font-weight: 600;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 8px;
                  "
                >
                  Go to Seller Dashboard
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 32px 0 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
      Welcome to the Semamart family! If you need help getting started with your first listing, 
      visit our <a href="${frontendUrl}/seller-guide" style="color: #6EC1E5; text-decoration: underline;">Seller Guide</a> 
      or contact support.
    </p>
  `;

  return baseLayout({
    title: "Seller Registration Complete | Semamart",
    preheader: "Success! Your seller account #" + sellerName + " is now active.",
    bodyHtml,
  });
};

module.exports = registrationCompleteSellerTemplate;