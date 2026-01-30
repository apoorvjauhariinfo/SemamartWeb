// utils/emails/templates/productBelowMOQSeller.js
const baseLayout = require("../layouts/baseLayout");

const productBelowMOQSellerTemplate = ({
  sellerName,
  products,
  bannerImageUrl,
  frontendUrl,
}) => {
  const productsHtml = products
    .map(
      (product) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
            <p style="margin: 0; font-size: 14px; color: #111827; font-weight: 600;">${product.name}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 4px;">
              <tr>
                <td style="font-size: 13px; color: #6b7280;">
                  Current: <span style="color: #111827; font-weight: 600;">${product.currentStock}</span> 
                  <span style="margin: 0 8px;">•</span> 
                  MOQ: <span style="color: #111827; font-weight: 600;">${product.moq}</span>
                </td>
                <td align="right" style="font-size: 12px; color: #f59e0b; font-weight: 700; text-transform: uppercase;">
                  ⚠️ Low Stock
                </td>
              </tr>
            </table>
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
            alt="Low Stock Alert"
            width="800"
            style="width: 100%; max-width: 800px; border-radius: 12px; display: block;"
          />
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      Low stock alert ⚠️
    </h2>

    <p style="margin: 0 0 24px; font-size: 16px; color: #2a2a2e; line-height: 1.6;">
      Hi ${sellerName || "Seller"},<br/><br/>
      Heads up! One or more of your products have fallen below your <strong>Minimum Order Quantity (MOQ)</strong> or buffer stock level. We recommend restocking soon to ensure customers can continue purchasing without interruption.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin: 24px 0;">
      <tr>
        <td style="padding: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 8px;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Inventory Overview
                </p>
              </td>
            </tr>
            ${productsHtml}
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
      <tr>
        <td align="left">
          <table cellpadding="0" cellspacing="0" style="border-collapse: separate;">
            <tr>
              <td align="center" bgcolor="#f59e0b" style="border-radius: 8px;">
                <a
                  href="${frontendUrl}/seller/products"
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
                  Restock Products
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 32px 0 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
      Proactive inventory management helps maintain your seller performance and customer trust. 
      Need help? <a href="${frontendUrl}/support" style="color: #6EC1E5; text-decoration: underline;">Contact Seller Support</a>.
    </p>
  `;

  return baseLayout({
    title: "Low Stock Alert | Semamart Seller",
    preheader: "Inventory Warning: Some items are falling below MOQ.",
    bodyHtml,
  });
};

module.exports = productBelowMOQSellerTemplate;