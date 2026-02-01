// utils/emails/templates/verifyPaymentAdmin.js
const baseLayout = require("../layouts/baseLayout");

const verifyPaymentAdminTemplate = ({
  customerName,
  orderId,
  items,
  totalAmount,
  paymentMethod,
  bannerImageUrl,
  frontendUrl,
}) => {
  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
            <p style="margin: 0; font-size: 14px; color: #111827; font-weight: 600;">${item.name}</p>
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
            alt="Payment Verification Required"
            width="800"
            style="width: 100%; max-width: 800px; border-radius: 12px; display: block;"
          />
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      New payment received 💳
    </h2>

    <p style="margin: 0 0 24px; font-size: 16px; color: #2a2a2e; line-height: 1.6;">
      Hello Admin,<br/><br/>
      A new payment has been submitted by <strong>${customerName}</strong> and requires manual verification. 
      Please cross-reference this with the bank records and confirm the order status.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin: 24px 0;">
      <tr>
        <td style="padding: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 12px;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Institute / Customer
                </p>
                <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #111827;">
                  ${customerName}
                </p>
                <p style="margin: 12px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Order ID
                </p>
                <p style="margin: 4px 0 12px; font-size: 16px; font-weight: 600; color: #111827;">
                  #${orderId}
                </p>
              </td>
            </tr>

            ${itemsHtml}

            <tr>
              <td style="padding-top: 16px;">
                 <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Payment Method
                </p>
                <p style="margin: 4px 0 12px; font-size: 15px; color: #111827;">
                  ${paymentMethod || "Manual / Bank Transfer"}
                </p>
                
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Total Amount to Verify
                </p>
                <p style="margin: 4px 0 0; font-size: 20px; font-weight: 700; color: #6366f1;">
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
                  Review & Confirm Payment
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 32px 0 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
      This is an automated administrative notification. Please ensure all verification steps are completed 
      before marking the order as 'Paid'.
    </p>
  `;

  return baseLayout({
    title: "Payment Verification Required | Admin",
    preheader: "Action Required: Verify payment for order #" + orderId,
    bodyHtml,
  });
};

module.exports = verifyPaymentAdminTemplate;