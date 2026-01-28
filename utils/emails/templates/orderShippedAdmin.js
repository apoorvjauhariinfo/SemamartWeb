// utils/emails/templates/orderShippedAdmin.js
const baseLayout = require("../layouts/baseLayout");

const orderShippedAdminTemplate = ({
  orderId,
  instituteName,
  bannerImageUrl,
  frontendUrl,
  trackingNumber, // Optional: for added admin utility
  carrierName,    // Optional: for added admin utility
}) => {
  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom: 32px;">
          <img
            src="${bannerImageUrl}"
            alt="Order Shipped"
            width="800"
            style="width: 100%; max-width: 800px; border-radius: 12px; display: block;"
          />
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      Order shipped 🚚
    </h2>

    <p style="margin: 0 0 24px; font-size: 16px; color: #2a2a2e; line-height: 1.6;">
      Hello Admin,<br/><br/>
      Order <strong>#${orderId}</strong> for <strong>${instituteName}</strong> has been marked as shipped. 
      The customer has been notified and can now track their package.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin: 24px 0;">
      <tr>
        <td style="padding: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 16px; border-bottom: 1px solid #f3f4f6;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Order ID
                </p>
                <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #111827;">
                  #${orderId}
                </p>
              </td>
            </tr>
            
            ${trackingNumber ? `
            <tr>
              <td style="padding-top: 16px;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Logistics Info
                </p>
                <p style="margin: 4px 0 0; font-size: 15px; color: #111827;">
                  <strong>Carrier:</strong> ${carrierName || 'Standard Shipping'}<br/>
                  <strong>Tracking:</strong> <span style="color: #6366f1; font-weight: 600;">${trackingNumber}</span>
                </p>
              </td>
            </tr>` : `
            <tr>
              <td style="padding-top: 16px;">
                <p style="margin: 0; font-size: 14px; color: #6b7280; font-style: italic;">
                  Dispatched via internal logistics / partner carrier.
                </p>
              </td>
            </tr>`}
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
                  View Order Details
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 32px 0 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
      This notification is for administrative records. Ensure the fulfillment status reflects accurately in the dashboard.
    </p>
  `;

  return baseLayout({
    title: "Order Shipped | Admin Notification",
    preheader: "Order #" + orderId + " has been successfully dispatched.",
    bodyHtml,
  });
};

module.exports = orderShippedAdminTemplate;