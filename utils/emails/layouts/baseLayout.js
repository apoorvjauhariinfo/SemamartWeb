// utils/emails/layouts/baseLayout.js

const baseEmailLayout = ({ title, preheader, bodyHtml }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>${title || "Semamart"}</title>

  <style>
    body {
      margin: 0; padding: 0;
      background-color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { display: block; max-width: 100%; height: auto; border: 0; outline: none; }

    /* Responsive styles */
    @media only screen and (max-width: 800px) {
      .container { width: 100% !important; border-radius: 0px !important; }
      .trust-cell { padding: 10px !important; display: inline-block !important; }
      .footer-info { width: 100% !important; display: block !important; padding-bottom: 20px !important; }
    }
  </style>
</head>

<body style="margin: 0; padding: 0; background-color: #f3f4f6;">

  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #f3f4f6;">
    ${preheader || ""}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f3f4f6" style="table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        
<table 
  class="container"
  width="800" 
  cellpadding="0" 
  cellspacing="0" 
  style="
    max-width: 800px; 
    width: 100%;
    margin: 0 auto; 
    background: #ffffff; 
    border-radius: 16px; 
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  "
>          
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(180deg, #8ceff2 0%, #ffffff 50%, #e7f28c 100%); border-bottom: 2px solid #f97316;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" valign="middle">
                    <a href="https://semamart.com" style="text-decoration: none;">
                      <img src="https://res.cloudinary.com/deom4dy3l/image/upload/v1768853563/semamart-logo-full_gvgckd.png" alt="Semamart" width="160" style="display: block;">
                    </a>
                  </td>
                  <td align="right" valign="middle">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0 12px;"><a href="${process.env.FRONTEND_URL || "https://semamart.com"}" style="color: #111827; font-size: 14px; font-weight: 600; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">Shop</a></td>
                        <td style="padding: 0 12px;"><a href="${process.env.FRONTEND_URL || "https://semamart.com"}/account/orders" style="color: #111827; font-size: 14px; font-weight: 600; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">Orders</a></td>
                        <td style="padding: 0 0 0 12px;"><a href="${process.env.FRONTEND_URL || "https://semamart.com"}/support" style="color: #111827; font-size: 14px; font-weight: 600; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">Support</a></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 50px;">
              ${bodyHtml}
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 32px 20px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 24px; font-size: 18px; font-weight: 700; color: #111827;">Why choose Semamart?</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td class="trust-cell" style="padding: 0 15px; font-size: 15px; color: #374151; white-space: nowrap;">
                    <span style="font-size: 18px;">✔</span> Genuine Products
                  </td>
                  <td class="trust-cell" style="padding: 0 15px; font-size: 15px; color: #374151; white-space: nowrap;">
                    <span style="font-size: 18px;">🚚</span> Pan-India Delivery
                  </td>
                  <td class="trust-cell" style="padding: 0 15px; font-size: 15px; color: #374151; white-space: nowrap;">
                    <span style="font-size: 18px;">🔒</span> Secure Payments
                  </td>
                  <td class="trust-cell" style="padding: 0 15px; font-size: 15px; color: #374151; white-space: nowrap;">
                    <span style="font-size: 18px;">🇮🇳</span> Made in India
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 48px 40px; background: linear-gradient(180deg, #e7f28c 0%, #ffffff 25%, #8ceff2  100%); border-top: 2px solid #f97316;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0 15px;"><img src="https://res.cloudinary.com/deom4dy3l/image/upload/v1768853563/semamart-logo-full_gvgckd.png" alt="Semamart" width="150"></td>
                        <td style="padding: 0 15px;"><img src="https://res.cloudinary.com/deom4dy3l/image/upload/v1768884581/make-in-india-badge_l3e67y.png" alt="Make in India" width="60"></td>
                        <td style="padding: 0 15px;"><img src="https://res.cloudinary.com/deom4dy3l/image/upload/v1768884595/atmanirbhar-bharat-badge_ezkgwy.png" alt="Atmanirbhar Bharat" width="55"></td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom: 20px; border-bottom: 1px solid #d1d5db;">
                    <p style="margin: 0; color: #111827; font-weight: 700; font-size: 16px;">SEMA Healthcare Private Limited</p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 24px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="footer-info" width="50%" style="vertical-align: top; font-size: 14px; color: #374151; line-height: 1.8;">
                          <strong>Email:</strong> info@semamart.com<br>
                          <strong>GST:</strong> 07ABKCS8538F1ZX
                        </td>
                        <td class="footer-info" width="50%" style="vertical-align: top; font-size: 14px; color: #374151; line-height: 1.8;">
                          <strong>Phone:</strong> +91 93196 54455<br>
                          <strong>Alt:</strong> +91 73037 69555
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding: 0 0 32px;">
                    <div style="background-color: #ecfdf5; border-radius: 8px; padding: 16px; border: 1px solid #a7f3d0;">
                      <p style="margin: 0; color: #065f46; font-size: 15px; font-weight: 600;">
                        🌱 1% of every purchase is contributed to sustainable development
                      </p>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td align="center">
                    <p style="margin: 0 0 15px; color: #111827; font-weight: 700; font-size: 14px;">Quick Links</p>
                    <div style="font-size: 13px; color: #2563eb; line-height: 2.2;">
                      <a href="https://semamart.com/privacy-policy" style="color: #2563eb; text-decoration: none;">Privacy Policy</a> | 
                      <a href="https://semamart.com/refund-and-cancellation" style="color: #2563eb; text-decoration: none;">Refund Policy</a> | 
                      <a href="https://semamart.com/cookie-policy" style="color: #2563eb; text-decoration: none;">Cookie Policy</a> | 
                      <a href="https://semamart.com/disclaimer" style="color: #2563eb; text-decoration: none;">Disclaimer</a><br>
                      <a href="https://semamart.com/shipping-delivery-policy" style="color: #2563eb; text-decoration: none;">Shipping Policy</a> | 
                      <a href="https://semamart.com/about" style="color: #2563eb; text-decoration: none;">About Us</a> | 
                      <a href="https://semamart.com/terms-and-conditions" style="color: #2563eb; text-decoration: none;">Terms & Conditions</a>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding-top: 32px;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px;">
                      © 2026 semamart.com. All Rights Reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
};

module.exports = baseEmailLayout;
