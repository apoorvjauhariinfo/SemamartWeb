// utils/emails/templates/orderDeliveredAdmin.js
const baseLayout = require("../layouts/baseLayout");

const orderDeliveredAdminTemplate = ({
  orderId,
  instituteName,
  bannerImageUrl,
  frontendUrl,
}) => {
  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom: 32px;">
          <img
            src="${bannerImageUrl}"
            alt="Order Delivered Successfully"
            width="800"
            style="width: 100%; max-width: 800px; border-radius: 12px; display: block;"
          />
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      Order delivered successfully ✅
    </h2>

    <p style="margin: 0 0 24px; font-size: 16px; color: #2a2a2e; line-height: 1.6;">
      Hello Admin,<br/><br/>
      Order <strong>#${orderId}</strong> for <strong>${instituteName}</strong> has been confirmed as delivered. This marks the completion of the fulfillment cycle for this order.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin: 24px 0;">
      <tr>
        <td style="padding: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 16px; border-bottom: 1px solid #f3f4f6;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Reference Number
                </p>
                <p style="margin: 4px 0 0; font-size: 16px; font-weight: 700; color: #111827;">
                  #${orderId}
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding-top: 16px;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Customer / Institute
                </p>
                <p style="margin: 4px 0 0; font-size: 16px; color: #111827; font-weight: 600;">
                  ${instituteName}
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
              <td align="center" bgcolor="#16a34a" style="border-radius: 8px;">
                <a
                  href="${frontendUrl}/admin/orders/${orderId}"
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
                  View Delivery Summary
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 32px 0 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
      The customer has been sent a separate confirmation email. This notification is for your internal logistics and accounting records.
    </p>
  `;

  return baseLayout({
    title: "Order Delivered | Admin",
    preheader: "Success: Order #" + orderId + " has reached its destination.",
    bodyHtml,
  });
};

module.exports = orderDeliveredAdminTemplate;