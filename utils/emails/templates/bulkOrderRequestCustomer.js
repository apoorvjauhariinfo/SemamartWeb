// utils/emails/templates/bulkOrderRequestCustomer.js
const baseLayout = require("../layouts/baseLayout");

const bulkOrderRequestCustomerTemplate = ({
  customerName,
  products,
  notes,
  bannerImageUrl,
  frontendUrl,
}) => {
  const productsHtml = products
    .map(
      (product) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
            <p style="margin: 0; font-size: 14px; color: #111827; font-weight: 600;">${product.name}</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">Quantity: ${product.quantity}</p>
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
            alt="Bulk Order Request Received"
            width="800"
            style="width: 100%; max-width: 800px; border-radius: 12px; display: block;"
          />
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      Bulk order request received 📦
    </h2>

    <p style="margin: 0 0 24px; font-size: 16px; color: #2a2a2e; line-height: 1.6;">
      Hi ${customerName || "there"},<br/><br/>
      Thank you for your interest in a bulk purchase! We've received your inquiry and our team is currently reviewing the availability and pricing for your requested items.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px; background: #f0f9ff; border-radius: 12px; border: 1px solid #bae6fd;">
          <p style="margin: 0; font-size: 14px; color: #0369a1; line-height: 1.5;">
            <strong>What happens next?</strong><br/>
            An account manager will review your request and contact you via email within 24–48 hours with a formal quote and delivery timeline.
          </p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px;">
          <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
            Items in your Request
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${productsHtml}
          </table>
        </td>
      </tr>
    </table>

    ${
      notes
        ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
      <tr>
        <td style="padding: 0 24px;">
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; color: #111827;">YOUR ADDITIONAL NOTES:</p>
          <p style="margin: 0; font-size: 14px; color: #4b5563; font-style: italic;">"${Array.isArray(notes) ? notes.join(", ") : notes}"</p>
        </td>
      </tr>
    </table>`
        : ""
    }

    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
      <tr>
        <td align="left">
          <table cellpadding="0" cellspacing="0" style="border-collapse: separate;">
            <tr>
              <td align="center" bgcolor="#6EC1E5" style="border-radius: 8px;">
                <a
                  href="${frontendUrl}/dashboard/bulk-orders"
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
                  Track My Requests
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 32px 0 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
      Need to make a change? Simply reply to this email or reach out to our 
      <a href="${frontendUrl}/support" style="color: #6EC1E5; text-decoration: underline;">support team</a>.
    </p>
  `;

  return baseLayout({
    title: "Bulk Order Request Received | Semamart",
    preheader: "We're reviewing your bulk order request. Hang tight!",
    bodyHtml,
  });
};

module.exports = bulkOrderRequestCustomerTemplate;
