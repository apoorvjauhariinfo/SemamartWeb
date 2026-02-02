const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { uploadV2 } = require("../multer");
const { isSeller } = require("../middleware/auth");
const { ProductVariant, Product } = require("../model/product");
const sendProductBelowMOQSellerEmail = require("../utils/emails/productBelowMOQSeller");
const sendProductOutOfStockSellerEmail = require("../utils/emails/productOutOfStockSeller");

const path = require("path");
const fs = require("fs");

const getMinQty = (product) => {
  if (!product?.minmaxrule) return 0;

  try {
    const rule =
      typeof product.minmaxrule === "string"
        ? JSON.parse(product.minmaxrule)
        : product.minmaxrule;

    return Number(rule?.minQty) || 0;
  } catch {
    return 0;
  }
};

router.post(
  "/post-variant",
  isSeller,
  uploadV2.single("thumbnail"),
  catchAsyncErrors(async (req, res) => {
    const { productId, ...a } = req.body;
    const product = await Product.findById(productId);
    if (!product) throw new ErrorHandler("Product not found", 404);

    if (req.file) {
      const variant = await ProductVariant.create({
        ...a,
        productId: product._id,
        thumbnail: req.file.filename,
      });

      product.variants.push(variant);
      await product.save();
      res.status(201).json({ success: true });
      return;
    }
    throw new ErrorHandler();
  }),
);

router.put(
  "/update-variant/:variantId",
  isSeller,
  uploadV2.single("thumbnail"),
  catchAsyncErrors(async (req, res) => {
    const { variantId } = req.params;
    const variant =
      await ProductVariant.findById(variantId).populate("productId");

    const oldStock = variant.stock;

    if (!variant) throw new ErrorHandler("Not found", 404);
    if (variant.productId.shopId.toString() !== req.seller._id.toString())
      throw new ErrorHandler("Not authorised", 401);

    if (req.file) {
      if (variant.thumbnail) {
        const imgPath = path.join(
          process.cwd(),
          "uploads",
          "images",
          variant.thumbnail,
        );
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }
      }
      variant.thumbnail = req.file.filename;
    }

    req.body.bulkOrders = JSON.parse(req.body.bulkOrders);

    Object.keys(req.body).forEach((k) => {
      variant[k] = req.body[k];
    });

    await variant.save();
    const newStock = variant.stock;
    const minQty = getMinQty(variant.productId);

    // prepare product payload (your templates expect an array)
    const productsPayload = [
      {
        productName: variant.productId?.name || "Unknown Product", // Added optional chaining
        variant:
          [variant.size, variant.colorOption].filter(Boolean).join(" / ") ||
          "Default",
        stock: newStock || 0,
        minQty: minQty || 0,
      },
    ];

    // 🟥 OUT OF STOCK (crossing only)
    if (oldStock > 0 && newStock === 0) {
      sendProductOutOfStockSellerEmail({
        sellerEmail: req.seller.email,
        sellerName: req.seller.businessName || req.seller.name,
        products: productsPayload,
      }).catch((err) => console.error("Out of Stock Email Error:", err));
    }

    // 🟧 BELOW MOQ (crossing only)
    if (minQty > 0 && oldStock >= minQty && newStock < minQty && newStock > 0) {
      await sendProductBelowMOQSellerEmail({
        sellerEmail: req.seller.email,
        sellerName: req.seller.businessName || req.seller.name,
        products: productsPayload,
      });
    }

    if (variant.stock > oldStock) {
      const notifyUsers = require("../utils/notifyUser");
      await notifyUsers();
    }
    res.json({ success: true });
  }),
);

module.exports = router;
