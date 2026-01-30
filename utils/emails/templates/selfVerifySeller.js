// utils/emails/templates/selfVerifySeller.js
const baseLayout = require("../layouts/baseLayout");

const selfVerifySellerTemplate = ({
  sellerName,
  verificationLink,
  bannerImageUrl,
}) => {
  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom: 32px;">
          <img
            src="${bannerImageUrl}"
            alt="Verify Seller Email"
            width="800"
            style="width: 100%; max-width: 800px; border-radius: 12px; display: block;"
          />
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      Verify your email address 🔐
    </h2>

    <p style="margin: 0 0 24px; font-size: 16px; color: #2a2a2e; line-height: 1.6;">
      Hi ${sellerName || "Seller"},<br/><br/>
      Welcome to the <strong>Semamart Seller Community</strong>! We're excited to help you grow your business. 
      Please confirm your email address to continue your onboarding and access your seller dashboard.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
      <tr>
        <td align="left">
          <table cellpadding="0" cellspacing="0" style="border-collapse: separate;">
            <tr>
              <td align="center" bgcolor="#111827" style="border-radius: 8px;">
                <a
                  href="${verificationLink}"
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
                  Verify Email Address
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 8px; margin-bottom: 32px;">
      <tr>
        <td style="padding: 16px; font-size: 12px; color: #6b7280; line-height: 1.4; word-break: break-all;">
          <strong>Link not working?</strong> Copy and paste this into your browser: <br/>
          <span style="color: #6EC1E5;">${verificationLink}</span>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
      If you did not register as a seller on Semamart, you can safely ignore this email. 
      This link will expire soon for security reasons.
    </p>
  `;

  return baseLayout({
    title: "Verify Seller Email | Semamart",
    preheader: "Complete your seller registration on Semamart",
    bodyHtml,
  });
};

module.exports = selfVerifySellerTemplate;