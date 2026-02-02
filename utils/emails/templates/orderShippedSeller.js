// utils/emails/templates/orderShippedSeller.js
const baseLayout = require("../layouts/baseLayout");

const orderShippedSellerTemplate = ({
  sellerName,
  orderId,
  productName,
  qty,
  totalAmount,
  logisticPartner,
  trackingNumber,
  bannerImageUrl,
  frontendUrl,
}) => {
  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom: 32px;">
          <img src="${bannerImageUrl}" alt="Order Shipped Successfully" width="800" style="width: 100%; max-width: 800px; border-radius: 12px; display: block;" />
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      Order shipped successfully 🚚
    </h2>

    <p style="margin: 0 0 24px; font-size: 16px; color: #2a2a2e; line-height: 1.6;">
      Hi ${sellerName || "Seller"},<br/><br/>
      Great job! Order <strong>#${orderId}</strong> has been marked as shipped. 
      The customer has been notified and the package is now in the delivery phase.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background: #fdf6f2; border: 1px solid #fed7aa; border-radius: 12px; margin: 24px 0;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 12px; font-size: 12px; text-transform: uppercase; color: #c2410c; font-weight: 700; letter-spacing: 0.05em;">
            Dispatch Confirmation
          </p>
          <p style="margin: 0; font-size: 15px; color: #1e293b; line-height: 1.5;">
            <strong>Carrier Partner:</strong> ${logisticPartner}<br/>
            <strong>Tracking Number:</strong> ${trackingNumber}
          </p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin: 24px 0;">
      <tr>
        <td style="padding: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 8px;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Order ID</p>
                <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #111827;">#${orderId}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 0; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Shipped Items</p>
                <p style="margin: 4px 0 0; font-size: 15px; color: #111827;">
                  <strong>${productName}</strong> <span style="color: #6b7280; margin-left: 8px;">(Qty: ${qty})</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 16px;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Order Value</p>
                <p style="margin: 4px 0 0; font-size: 20px; font-weight: 700; color: #f97316;">₹${totalAmount}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
      <tr>
        <td align="left">
          <a href="${frontendUrl}/seller/orders/${orderId}" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background-color: #111827; text-decoration: none; border-radius: 8px;">
            View Order Details
          </a>
        </td>
      </tr>
    </table>
  `;

  return baseLayout({
    title: "Order Shipped | Semamart Seller",
    preheader: "Success! Order #" + orderId + " is now on its way to the customer.",
    bodyHtml,
  });
};

module.exports = orderShippedSellerTemplate;