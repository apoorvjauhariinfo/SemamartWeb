// utils/emails/templates/bulkOrderRequestAdmin.js
const baseLayout = require("../layouts/baseLayout");

const bulkOrderRequestAdminTemplate = ({
  instituteName,
  instituteEmail,
  institutePhone,
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
            <p style="margin: 4px 0 0; font-size: 13px; color: #6366f1;">Requested Qty: ${product.quantity}</p>
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
            alt="Bulk Order Request"
            width="800"
            style="width: 100%; max-width: 800px; border-radius: 12px; display: block;"
          />
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      New bulk order request 📦
    </h2>

    <p style="margin: 0 0 24px; font-size: 16px; color: #2a2a2e; line-height: 1.6;">
      Hello Admin,<br/><br/>
      A new high-volume inquiry has been submitted. Please review the institutional details and requested inventory below to prepare a quote.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px;">
          <p style="margin: 0 0 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
            Institutional Contact
          </p>
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #111827;">${instituteName}</p>
          <p style="margin: 8px 0 0; font-size: 14px; color: #374151;">
            📧 ${instituteEmail} ${institutePhone ? `<br/>📞 ${institutePhone}` : ""}
          </p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px;">
          <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
            Requested Products
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${productsHtml}
          </table>
        </td>
      </tr>
    </table>

    ${notes ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
      <tr>
        <td style="padding: 16px; background: #f9fafb; border-left: 4px solid #6366f1; border-radius: 4px;">
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; color: #111827; text-transform: uppercase;">Additional Notes:</p>
          <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5; font-style: italic;">"${notes}"</p>
        </td>
      </tr>
    </table>` : ""}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
      <tr>
        <td align="left">
          <table cellpadding="0" cellspacing="0" style="border-collapse: separate;">
            <tr>
              <td align="center" bgcolor="#111827" style="border-radius: 8px;">
                <a
                  href="${frontendUrl}/admin/bulk-orders"
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
                  Review Request & Respond
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return baseLayout({
    title: "Bulk Order Request | Admin",
    preheader: "High-volume inquiry from " + instituteName,
    bodyHtml,
  });
};

module.exports = bulkOrderRequestAdminTemplate;