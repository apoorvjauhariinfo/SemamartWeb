// utils/emails/templates/productOutOfStockSeller.js
const baseLayout = require("../layouts/baseLayout");

const productOutOfStockSellerTemplate = ({
  sellerName,
  products, // Expected as array of { name, sku } or just { name }
  bannerImageUrl,
  frontendUrl,
}) => {
  const productsHtml = products
    .map(
      (product) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
            <p style="margin: 0; font-size: 14px; color: #111827; font-weight: 600;">${product.name}</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #dc2626; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
              🚨 Out of Stock
            </p>
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
            alt="Product Out of Stock Alert"
            width="800"
            style="width: 100%; max-width: 800px; border-radius: 12px; display: block;"
          />
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      Product out of stock 🚨
    </h2>

    <p style="margin: 0 0 24px; font-size: 16px; color: #2a2a2e; line-height: 1.6;">
      Hi ${sellerName || "Seller"},<br/><br/>
      Heads up! One or more of your listed products have run out of stock. These items are currently hidden from customers to prevent unfulfillable orders.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin: 24px 0;">
      <tr>
        <td style="padding: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 8px;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Affected Products
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
              <td align="center" bgcolor="#dc2626" style="border-radius: 8px;">
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
                  Update Inventory Now
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 32px 0 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
      Keeping your inventory updated helps avoid missed orders and maintains your seller rating. 
      Need help? <a href="${frontendUrl}/support" style="color: #6EC1E5; text-decoration: underline;">Contact Seller Support</a>.
    </p>
  `;

  return baseLayout({
    title: "Stock Alert | Semamart Seller",
    preheader: "Urgent: One or more products are out of stock on Semamart",
    bodyHtml,
  });
};

module.exports = productOutOfStockSellerTemplate;