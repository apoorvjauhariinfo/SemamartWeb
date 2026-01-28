const { Product, ProductVariant } = require("../model/product");
const NotifyRequest = require("../model/notifyRequest");
const sendProductBackInStockCustomerEmail = require("./emails/productBackInStockCustomer");

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
        await sendProductBackInStockCustomerEmail({
          customerEmail: req.email,
          customerName: req.name || "Customer",
          products: [
            {
              productName: product.name,
              variant:
                [variant.size, variant.colorOption]
                  .filter(Boolean)
                  .join(" / ") || "Default",
              minQty,
              stock: variant.stock,
              productUrl: `${HOST}/product/${product._id}`,
              thumbnail: variant.thumbnail || null,
            },
          ],
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
