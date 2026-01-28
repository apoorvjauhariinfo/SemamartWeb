// utils/emails/templates/productBackInStockCustomer.js
const baseLayout = require("../layouts/baseLayout");

const productBackInStockCustomerTemplate = ({
  customerName,
  products,
  bannerImageUrl,
  frontendUrl,
}) => {
  const productsHtml = products
    .map(
      (product) => `
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #f3f4f6;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin: 0; font-size: 14px; color: #111827; font-weight: 600;">${product.name}</p>
                  <p style="margin: 4px 0 0; font-size: 12px; color: #16a34a; font-weight: 700; text-transform: uppercase;">
                    ✓ Back in Stock
                  </p>
                </td>
                <td align="right">
                  <a
                    href="${frontendUrl}/products/${product.slug}"
                    target="_blank"
                    style="
                      display: inline-block;
                      padding: 8px 16px;
                      background-color: #f3f4f6;
                      color: #111827;
                      font-size: 13px;
                      font-weight: 600;
                      text-decoration: none;
                      border-radius: 6px;
                    "
                  >
                    Buy Now
                  </a>
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
            alt="Product Back in Stock"
            width="800"
            style="width: 100%; max-width: 800px; border-radius: 12px; display: block;"
          />
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      It's back in stock! 🎉
    </h2>

    <p style="margin: 0 0 24px; font-size: 16px; color: #2a2a2e; line-height: 1.6;">
      Hi ${customerName || "there"},<br/><br/>
      Great news! You asked to be notified when these items were available again. They are officially <strong>back in stock</strong> and ready to ship. 
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin: 24px 0;">
      <tr>
        <td style="padding: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 8px;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">
                  Available Now
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
              <td align="center" bgcolor="#6EC1E5" style="border-radius: 8px;">
                <a
                  href="${frontendUrl}/shop"
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
                  Visit the Shop
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 32px 0 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
      Stock may be limited and available on a first-come, first-served basis. 
      Need help? <a href="${frontendUrl}/support" style="color: #6EC1E5; text-decoration: underline;">Contact our support team</a>.
    </p>
  `;

  return baseLayout({
    title: "Back in Stock | Semamart",
    preheader: "Good news! Items you liked are back in stock and ready to order.",
    bodyHtml,
  });
};

module.exports = productBackInStockCustomerTemplate;