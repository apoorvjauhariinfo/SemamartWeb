// utils/emails/templates/orderPlacedCustomer.js
const baseLayout = require("../layouts/baseLayout");

const orderPlacedCustomerTemplate = ({
  customerName,
  orderId,
  productName, // Added
  qty,         // Added
  totalAmount,
  bannerImageUrl,
  frontendUrl,
}) => {
  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom: 32px;">
          <img
            src="${bannerImageUrl}"
            alt="Order Placed"
            width="800"
            style="width: 100%; max-width: 800px; border-radius: 12px; display: block;"
          />
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      Your order has been placed! ✅
    </h2>

    <p style="margin: 0 0 24px; font-size: 16px; color: #2a2a2e; line-height: 1.6;">
      Hi ${customerName || "there"},<br/><br/>
      Thank you for shopping with <strong>Semamart</strong>. We’ve received your order and it is 
      <span style="color: #61ceb6; font-weight: 600;">currently being prepared</span>. 
      We’ll notify you once it’s on the way!
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
                <p style="margin: 4px 0 0; font-size: 15px; font-weight: 600; color: #111827;">
                  #${orderId}
                </p>
              </td>
            </tr>
            
            <tr>
              <td style="padding: 16px 0; border-bottom: 1px solid #f3f4f6;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Items Ordered
                </p>
                <p style="margin: 4px 0 0; font-size: 15px; color: #111827; line-height: 1.4;">
                  <strong>${productName}</strong> <span style="color: #6b7280; margin-left: 8px;">(Qty: ${qty})</span>
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding-top: 16px;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Total Amount
                </p>
                <p style="margin: 4px 0 0; font-size: 20px; font-weight: 700; color: #6EC1E5;">
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
              <td align="center" bgcolor="#6EC1E5" style="border-radius: 8px;">
                <a
                  href="${frontendUrl}/orders/${orderId}"
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
                  Track Your Order
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 32px 0 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
      Thank you for choosing <strong>Semamart</strong>. If you have any questions, 
      feel free to <a href="${frontendUrl}/support" style="color: #6EC1E5; text-decoration: underline;">contact our support team</a>.
    </p>
  `;

  return baseLayout({
    title: "Order Placed | Semamart",
    preheader: "Success! Your Semamart order #" + orderId + " has been received.",
    bodyHtml,
  });
};

module.exports = orderPlacedCustomerTemplate;