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

const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeBulkOrders = (bulkOrders) => {
  if (!Array.isArray(bulkOrders)) return [];
  return bulkOrders
    .map((order) => ({
      qty: toFiniteNumber(order?.qty, 0),
      price: toFiniteNumber(order?.price, 0),
    }))
    .filter((order) => order.qty > 0 && order.price > 0);
};

router.post(
  "/post-variant",
  isSeller,
  uploadV2.single("thumbnail"),
  catchAsyncErrors(async (req, res) => {
    const { productId, ...a } = req.body;
    // If `bulkOrders` is sent as a form field it will be a string (e.g. "[]" or "[{...}]").
    // Parse it into an array so Mongoose receives the correct type.
    if (a.bulkOrders && typeof a.bulkOrders === "string") {
      try {
        a.bulkOrders = JSON.parse(a.bulkOrders);
      } catch (e) {
        // ignore parse errors and leave as-is; validation will catch invalid shapes
      }
    }
    const product = await Product.findById(productId);
    if (!product) throw new ErrorHandler("Product not found", 404);

    const fallbackCommission = toFiniteNumber(product.commission, 0);
    const nextCommission = toFiniteNumber(
      a.commission ?? fallbackCommission,
      fallbackCommission,
    );
    const nextVariantPayload = {
      ...a,
      originalPrice: toFiniteNumber(a.originalPrice, 0),
      discountPrice:
        a.discountPrice === undefined || a.discountPrice === null || a.discountPrice === ""
          ? undefined
          : toFiniteNumber(a.discountPrice, 0),
      stock: toFiniteNumber(a.stock, 0),
      commission: nextCommission,
      bulkOrders: normalizeBulkOrders(a.bulkOrders),
    };

    if (req.file) {
      const variant = await ProductVariant.create({
        ...nextVariantPayload,
        productId: product._id,
        thumbnail: req.file.filename,
      });

      product.variants.push(variant);
      if (product.variants.length === 1 || !Number.isFinite(Number(product.commission))) {
        product.commission = variant.commission;
      }
      product.commissionHistory = Array.isArray(product.commissionHistory)
        ? product.commissionHistory
        : [];
      if (!product.commissionHistory.length) {
        product.commissionHistory.push({
          commission: product.commission,
          updatedAt: new Date(),
        });
      }
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
    const variant = await ProductVariant.findById(variantId).populate("productId");
    if (!variant) throw new ErrorHandler("Not found", 404);
    const oldStock = toFiniteNumber(variant.stock, 0);
    if (
      !variant.productId ||
      !variant.productId.shopId ||
      variant.productId.shopId.toString() !== req.seller._id.toString()
    )
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

    if (req.body.bulkOrders && typeof req.body.bulkOrders === "string") {
      try {
        req.body.bulkOrders = JSON.parse(req.body.bulkOrders);
      } catch (e) {
        // leave as-is; validation will handle incorrect shapes
      }
    }

    const incomingCommission =
      req.body.commission === undefined || req.body.commission === ""
        ? undefined
        : toFiniteNumber(req.body.commission, toFiniteNumber(variant.commission, 0));

    Object.keys(req.body).forEach((k) => {
      if (k === "commission") return;
      if (k === "originalPrice" || k === "discountPrice" || k === "stock") {
        variant[k] = toFiniteNumber(req.body[k], variant[k]);
        return;
      }
      if (k === "bulkOrders" && Array.isArray(req.body.bulkOrders)) {
        variant.bulkOrders = normalizeBulkOrders(req.body.bulkOrders);
        return;
      }
      variant[k] = req.body[k];
    });

    if (incomingCommission !== undefined) {
      if (!Array.isArray(variant.commissionHistory)) {
        variant.commissionHistory = [];
      }
      if (toFiniteNumber(variant.commission, 0) !== incomingCommission) {
        variant.commissionHistory.push({
          commission: incomingCommission,
          updatedAt: new Date(),
        });
      }
      variant.commission = incomingCommission;
    }

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
