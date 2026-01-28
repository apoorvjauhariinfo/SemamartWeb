// utils/emails/templates/orderReceivedAdmin.js
const baseLayout = require("../layouts/baseLayout");

const orderReceivedAdminTemplate = ({
  orderId,
  instituteName,
  items,
  totalAmount,
  bannerImageUrl,
  frontendUrl,
}) => {
  const itemsHtml = items
    .map(
      (i) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin: 0; font-size: 14px; color: #111827; font-weight: 600;">${i.name}</p>
                <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">Qty: ${i.quantity}</p>
              </td>
              <td align="right" style="font-size: 14px; color: #111827; font-weight: 600;">
                ₹${i.price}
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join("");

  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom: 32px;">
          <img
            src="${bannerImageUrl}"
            alt="New Order Received"
            width="800"
            style="width: 100%; max-width: 800px; border-radius: 12px; display: block;"
          />
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      New order received 📦
    </h2>

    <p style="margin: 0 0 24px; font-size: 16px; color: #2a2a2e; line-height: 1.6;">
      Hello Admin,<br/><br/>
      An order has been successfully placed by <strong>${instituteName}</strong>. Please review the details below to begin the fulfillment process.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 16px;">
                 <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Order ID
                </p>
                <p style="margin: 4px 0 0; font-size: 15px; font-weight: 700; color: #6366f1;">
                  #${orderId}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 8px; border-bottom: 2px solid #f3f4f6;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Order Summary
                </p>
              </td>
            </tr>
            ${itemsHtml}
            <tr>
              <td style="padding-top: 16px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size: 16px; font-weight: 700; color: #111827;">Total Amount</td>
                    <td align="right" style="font-size: 18px; font-weight: 800; color: #111827;">₹${totalAmount}</td>
                  </tr>
                </table>
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
                  Manage Order
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 32px 0 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
      This is an automated notification. To update the customer on their order status, please use the Order Management panel.
    </p>
  `;

  return baseLayout({
    title: "New Order Received | Admin",
    preheader: "New Order #" + orderId + " from " + instituteName,
    bodyHtml,
  });
};

module.exports = orderReceivedAdminTemplate;