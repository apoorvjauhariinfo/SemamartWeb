// utils/emails/templates/orderShippedAdmin.js
const baseLayout = require("../layouts/baseLayout");

const orderShippedAdminTemplate = ({
  orderId,
  instituteName,
  bannerImageUrl,
  frontendUrl,
  trackingNumber,
  carrierName,
}) => {
  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom: 32px;">
          <img src="${bannerImageUrl}" alt="Order Shipped" width="800" style="width: 100%; max-width: 800px; border-radius: 12px; display: block;" />
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      Order shipped 🚚
    </h2>

    <p style="margin: 0 0 24px; font-size: 16px; color: #2a2a2e; line-height: 1.6;">
      Hello Admin,<br/><br/>
      Order <strong>#${orderId}</strong> for <strong>${instituteName}</strong> has been marked as shipped by the seller. 
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; margin: 24px 0;">
      <tr>
        <td style="padding: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Order ID</p>
                <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #111827;">#${orderId}</p>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 16px;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Logistics Details</p>
                <p style="margin: 4px 0 0; font-size: 15px; color: #111827;">
                  <strong>Carrier:</strong> ${carrierName}<br/>
                  <strong>Tracking ID:</strong> <span style="color: #6366f1; font-weight: 600;">${trackingNumber}</span>
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
          <a href="${frontendUrl}/admin/orders/${orderId}" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background-color: #111827; text-decoration: none; border-radius: 8px;">
            Manage Order
          </a>
        </td>
      </tr>
    </table>
  `;

  return baseLayout({
    title: "Order Shipped | Admin Notification",
    preheader: `Order #${orderId} for ${instituteName} has been dispatched.`,
    bodyHtml,
  });
};

module.exports = orderShippedAdminTemplate;