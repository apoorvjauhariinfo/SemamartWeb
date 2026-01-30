// utils/emails/templates/newSellerAdminVerify.js
const baseLayout = require("../layouts/baseLayout");

const newSellerAdminVerifyTemplate = ({
  sellerName,
  sellerEmail,
  frontendUrl,
  bannerImageUrl,
}) => {
  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom: 32px;">
          <img
            src="${bannerImageUrl}"
            alt="New Seller Registration"
            width="800"
            style="width: 100%; max-width: 800px; border-radius: 12px; display: block;"
          />
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      New seller pending verification 🧾
    </h2>

    <p style="margin: 0 0 24px; font-size: 16px; color: #2a2a2e; line-height: 1.6;">
      Hello Admin,<br/><br/>
      A new seller has successfully verified their email and is now <strong>awaiting manual approval</strong> to start listing products on Semamart.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin: 24px 0;">
      <tr>
        <td style="padding: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 16px; border-bottom: 1px solid #f3f4f6;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Seller Name
                </p>
                <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #111827;">
                  ${sellerName}
                </p>
              </td>
            </tr>
            
            <tr>
              <td style="padding-top: 16px;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Registered Email
                </p>
                <p style="margin: 4px 0 0; font-size: 15px; color: #6366f1; font-weight: 600;">
                  ${sellerEmail}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
      <tr>
        <td align="left">
          <table cellpadding="0" cellspacing="0" style="border-collapse: separate;">
            <tr>
              <td align="center" bgcolor="#111827" style="border-radius: 8px;">
                <a
                  href="${frontendUrl}/admin/sellers"
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
                  Review Seller Profile
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 32px 0 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
      Please perform the necessary background checks before granting store access. 
      This is an automated system notification for the Semamart Admin Team.
    </p>
  `;

  return baseLayout({
    title: "New Seller Verification | Admin",
    preheader: "Action Required: A new seller #" + sellerName + " is waiting for approval.",
    bodyHtml,
  });
};

module.exports = newSellerAdminVerifyTemplate;