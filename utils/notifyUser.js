const { Product, ProductVariant } = require("../model/product");
const NotifyRequest = require("../model/notifyRequest");
const sendMail = require("./sendEmail");

const HOST = process.env.FRONTEND_URL || "http://localhost:3000";

/**
 * Converts any value to a finite number, fallback to 0
 */
const safeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Extract minQty from product.minmaxrule
 * minmaxrule is a STRING like: {"minQty":"7","maxQty":""}
 */
const getMinQty = (product) => {
  if (!product?.minmaxrule) return 0;

  try {
    const rule =
      typeof product.minmaxrule === "string"
        ? JSON.parse(product.minmaxrule)
        : product.minmaxrule;

    return safeNumber(rule?.minQty);
  } catch (err) {
    console.warn(
      `⚠️ Failed to parse minmaxrule for product ${product._id}`,
      product.minmaxrule
    );
    return 0;
  }
};

async function notifyUsers() {
  try {
    const requests = await NotifyRequest.find({ notified: false });

    for (const req of requests) {
      try {
        // Fetch variant
        const variant = await ProductVariant.findById(req.variant_id);
        if (!variant) {
          console.warn(`⚠️ Variant not found: ${req.variant_id}`);
          continue;
        }

        // Fetch product
        const product = await Product.findById(req.product_id);
        if (!product) {
          console.warn(`⚠️ Product not found: ${req.product_id}`);
          continue;
        }

        // ✅ CORRECT minQty extraction
        const minQty = getMinQty(product);

        if (!Number.isInteger(minQty) || minQty <= 0) {
          console.warn(
            `⚠️ Invalid minQty for product ${product._id}`,
            "raw minmaxrule:",
            product.minmaxrule,
            "parsed minQty:",
            minQty
          );
          continue;
        }

        // Stock check
        if (variant.stock < minQty) {
          console.log(
            `ℹ️ Not notifying: stock (${variant.stock}) < minQty (${minQty}) for ${product.name}`
          );
          continue;
        }

        // Email validation
        if (!req.email) {
          console.warn(`⚠️ Missing email for notify request ${req._id}`);
          continue;
        }

        // Email content
        const subject = `Product Back in Stock: ${product.name}`;
        const productUrl = `${HOST}/product/${product._id}`;

        const html = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; background: #f9f9f9; border-radius: 10px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); color: #222;">
    
    <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 15px; text-align: center; color: #222;">
      ${product.name} is now available!
    </h1>

    <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap; justify-content: center;">
      ${
        variant.thumbnail
          ? `<img src="${variant.thumbnail}" alt="${product.name}" style="width: 180px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />`
          : ''
      }
      <div style="flex: 1; min-width: 220px;">
        <p style="font-size: 16px; margin: 8px 0;">
          <strong>Variant:</strong> ${variant.colorOption || "Default"}
        </p>
        <p style="font-size: 16px; margin: 8px 0;">
          <strong>Minimum order quantity:</strong> <span style="color: #007bff;">${minQty}</span>
        </p>
        <p style="font-size: 14px; color: #555; margin-top: 15px;">
          Hurry! Stock is available now — don't miss out.
        </p>

        <a href="${productUrl}" style="
          display: inline-block;
          margin-top: 20px;
          padding: 12px 25px;
          background: linear-gradient(90deg, #0066ff, #0044cc);
          color: white;
          font-weight: 600;
          text-decoration: none;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 102, 255, 0.4);
          transition: background 0.3s ease;
        " 
          onmouseover="this.style.background='linear-gradient(90deg, #0044cc, #002a99)'" 
          onmouseout="this.style.background='linear-gradient(90deg, #0066ff, #0044cc)'"
        >
          Order Now
        </a>
      </div>
    </div>

    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />

    <p style="font-size: 12px; color: #999; text-align: center; line-height: 1.4;">
      You are receiving this email because you requested a notification for this product.
    </p>
  </div>
`;


        // Send email
        await sendMail({
          to: req.email,
          subject,
          html,
        });

        // Mark as notified
        req.notified = true;
        await req.save();

      } catch (innerErr) {
        console.error(`❌ Failed processing request ${req._id}:`, innerErr);
      }
    }
  } catch (err) {
    console.error("❌ Error notifying users:", err);
  }
}

module.exports = notifyUsers;
