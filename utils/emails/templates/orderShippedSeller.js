// utils/emails/templates/orderShippedSeller.js
const baseLayout = require("../layouts/baseLayout");

const orderShippedSellerTemplate = ({
  sellerName,
  orderId,
  productName,
  qty,
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
            alt="Order Shipped Successfully"
            width="800"
            style="width: 100%; max-width: 800px; border-radius: 12px; display: block;"
          />
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

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin: 24px 0;">
      <tr>
        <td style="padding: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 8px;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Order ID
                </p>
                <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #111827;">
                  #${orderId}
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding: 16px 0; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Shipped Items
                </p>
                <p style="margin: 4px 0 0; font-size: 15px; color: #111827; line-height: 1.4;">
                  <strong>${productName}</strong> <span style="color: #6b7280; margin-left: 8px;">(Qty: ${qty})</span>
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding-top: 16px;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Order Value
                </p>
                <p style="margin: 4px 0 0; font-size: 20px; font-weight: 700; color: #f97316;">
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
                  href="${frontendUrl}/seller/orders/${orderId}"
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
      Thank you for shipping on time. Timely fulfillment improves customer trust and your seller ratings. 
      Need help? <a href="${frontendUrl}/support" style="color: #6EC1E5; text-decoration: underline;">Contact Seller Support</a>.
    </p>
  `;

  return baseLayout({
    title: "Order Shipped | Semamart Seller",
    preheader: "Success! Order #" + orderId + " is now on its way to the customer.",
    bodyHtml,
  });
};

module.exports = orderShippedSellerTemplate;