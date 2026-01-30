// utils/emails/templates/verifyPaymentCustomer.js
const baseLayout = require("../layouts/baseLayout");

const verifyPaymentCustomerTemplate = ({
  customerName,
  orderId,
  items,
  totalAmount,
  bannerImageUrl,
  frontendUrl,
}) => {
  // Sync the item list to our clean row-based mobile style
  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 16px 0; border-top: 1px solid #f3f4f6;">
            <p style="margin: 0; font-size: 15px; color: #111827; font-weight: 600;">${item.name}</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">Qty: ${item.quantity} • ₹${item.price}</p>
          </td>
        </tr>
      `
    )
    .join("");

  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom: 32px;">
          <img
            src="${bannerImageUrl}"
            alt="Verify Payment"
            width="800"
            style="width: 100%; max-width: 800px; border-radius: 12px; display: block;"
          />
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      Payment verification required 💳
    </h2>

    <p style="margin: 0 0 24px; font-size: 16px; color: #2a2a2e; line-height: 1.6;">
      Hi ${customerName || "there"},<br/><br/>
      We’re waiting for payment verification to proceed with your order. 
      Please verify or complete the payment to avoid any delays in processing your items.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin: 24px 0;">
      <tr>
        <td style="padding: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 16px;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Order ID
                </p>
                <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #111827;">
                  #${orderId}
                </p>
              </td>
            </tr>

            ${itemsHtml}

            <tr>
              <td style="padding-top: 16px; border-top: 1px solid #f3f4f6;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Total Payable Amount
                </p>
                <p style="margin: 4px 0 0; font-size: 20px; font-weight: 700; color: #dc2626;">
                  ₹${totalAmount}
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
              <td align="center" bgcolor="#dc2626" style="border-radius: 8px;">
                <a
                  href="${frontendUrl}/orders/${orderId}/verify-payment"
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
                  Verify Payment Now
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 32px 0 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
      If payment has already been completed, please ignore this message. 
      Need help? <a href="${frontendUrl}/support" style="color: #6EC1E5; text-decoration: underline;">Contact our support team</a>.
    </p>
  `;

  return baseLayout({
    title: "Verify Payment | Semamart",
    preheader: "Important: Payment verification required for order #" + orderId,
    bodyHtml,
  });
};

module.exports = verifyPaymentCustomerTemplate;