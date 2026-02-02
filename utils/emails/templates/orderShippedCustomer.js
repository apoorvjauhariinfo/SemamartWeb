// utils/emails/templates/orderShippedCustomer.js
const baseLayout = require("../layouts/baseLayout");

const orderShippedCustomerTemplate = ({
  customerName,
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
          <img src="${bannerImageUrl}" alt="Order Shipped" width="800" style="width: 100%; max-width: 800px; border-radius: 12px; display: block;" />
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      Your order is on the way! 🚚
    </h2>

    <p style="margin: 0 0 24px; font-size: 16px; color: #2a2a2e; line-height: 1.6;">
      Hi ${customerName || "there"},<br/><br/>
      Great news! Your order has been <strong>shipped</strong>. Our delivery partner is working hard to get it to your doorstep.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; margin: 24px 0;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 12px; font-size: 12px; text-transform: uppercase; color: #0369a1; font-weight: 700; letter-spacing: 0.05em;">
            Shipping Information
          </p>
          <p style="margin: 0; font-size: 15px; color: #1e293b; line-height: 1.5;">
            <strong>Courier Partner:</strong> ${logisticPartner}<br/>
            <strong>Tracking ID:</strong> <span style="color: #0284c7; font-weight: 700;">${trackingNumber}</span>
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
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Items</p>
                <p style="margin: 4px 0 0; font-size: 15px; color: #111827;">
                  <strong>${productName}</strong> <span style="color: #6b7280; margin-left: 8px;">(Qty: ${qty})</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 16px;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Total Amount</p>
                <p style="margin: 4px 0 0; font-size: 20px; font-weight: 700; color: #6EC1E5;">₹${totalAmount}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
      <tr>
        <td align="left">
          <a href="${frontendUrl}/orders/${orderId}" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background-color: #6EC1E5; text-decoration: none; border-radius: 8px;">
            Track Your Package
          </a>
        </td>
      </tr>
    </table>
  `;

  return baseLayout({
    title: "Order Shipped | Semamart",
    preheader: "Your Semamart order #" + orderId + " is on the way!",
    bodyHtml,
  });
};

module.exports = orderShippedCustomerTemplate;