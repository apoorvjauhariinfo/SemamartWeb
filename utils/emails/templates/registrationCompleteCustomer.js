// utils/emails/templates/registrationCompleteCustomer.js
const baseLayout = require("../layouts/baseLayout");

const registrationCompleteCustomerTemplate = ({
  customerName,
  bannerImageUrl,
  frontendUrl,
}) => {
  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom: 32px;">
          <img
            src="${bannerImageUrl}"
            alt="Registration Successful"
            width="800"
            style="width: 100%; max-width: 800px; border-radius: 12px; display: block;"
          />
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      Registration successful 🎉
    </h2>

    <p style="margin: 0 0 24px; font-size: 16px; color: #2a2a2e; line-height: 1.6;">
      Hi ${customerName || "there"},<br/><br/>
      Your email has been successfully verified! Your <strong>Semamart</strong> account is now fully active and ready to go.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin: 24px 0;">
      <tr>
        <td style="padding: 24px;">
          <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6;">
            You can now place orders, manage your payments, and track your deliveries — all from your personalized dashboard.
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
                  href="${frontendUrl}/dashboard"
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
                  Go to Dashboard
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 32px 0 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
      Welcome to the community! If you have any questions, our 
      <a href="${frontendUrl}/support" style="color: #6EC1E5; text-decoration: underline;">support team</a> is always here to help.
    </p>
  `;

  return baseLayout({
    title: "Registration Complete | Semamart",
    preheader: "Welcome to Semamart! Your account is now active.",
    bodyHtml,
  });
};

module.exports = registrationCompleteCustomerTemplate;