const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { uploadV2 } = require("../multer");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
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

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getBulkOrderCommissionValue = (
  bulkOrder,
  variantCommission = null,
  productCommission = null,
) => {
  const direct = toNumberOrNull(bulkOrder?.commission);
  if (direct !== null) return direct;

  const variantLevel = toNumberOrNull(variantCommission);
  if (variantLevel !== null) return variantLevel;

  const productLevel = toNumberOrNull(productCommission);
  return productLevel !== null ? productLevel : 0;
};

const normalizeCommissionHistory = (history, fallbackCommission) => {
  if (Array.isArray(history) && history.length > 0) {
    return history
      .map((entry) => {
        const commission = toNumberOrNull(entry?.commission);
        if (commission === null) return null;
        return {
          commission,
          updatedAt: entry?.updatedAt ? new Date(entry.updatedAt) : new Date(),
        };
      })
      .filter(Boolean);
  }

  return [
    {
      commission: fallbackCommission,
      updatedAt: new Date(),
    },
  ];
};

const normalizeBulkOrders = (
  bulkOrders,
  variantCommission = 0,
  productCommission = null,
  existingBulkOrders = [],
) => {
  if (!Array.isArray(bulkOrders)) return [];
  return bulkOrders
    .map((order, index) => {
      const existingBulkOrder =
        existingBulkOrders.find(
          (entry) =>
            String(entry?._id || "") !== "" &&
            String(entry?._id) === String(order?._id),
        ) ?? existingBulkOrders[index];

      const commission = getBulkOrderCommissionValue(
        order,
        variantCommission,
        productCommission,
      );

      return {
        ...(existingBulkOrder?._id ? { _id: existingBulkOrder._id } : {}),
        qty: toFiniteNumber(order?.qty, 0),
        price: toFiniteNumber(order?.price, 0),
        commission,
        commissionHistory: normalizeCommissionHistory(
          order?.commissionHistory ?? existingBulkOrder?.commissionHistory,
          commission,
        ),
      };
    })
    .filter((order) => order.qty > 0 && order.price > 0);
};

router.post(
  "/post-variant",
  isSeller,
  uploadV2.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
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
    const nextVariantPayload = {
      ...a,
      originalPrice: toFiniteNumber(a.originalPrice, 0),
      discountPrice:
        a.discountPrice === undefined || a.discountPrice === null || a.discountPrice === ""
          ? undefined
          : toFiniteNumber(a.discountPrice, 0),
      stock: toFiniteNumber(a.stock, 0),
      commission: fallbackCommission,
      bulkOrders: normalizeBulkOrders(
        a.bulkOrders,
        fallbackCommission,
        product.commission,
      ),
    };

    const thumbnail = req.files?.thumbnail?.[0];
    const images = req.files?.images?.map((file) => file.filename) || [];

    if (thumbnail) {
      const variant = await ProductVariant.create({
        ...nextVariantPayload,
        productId: product._id,
        thumbnail: thumbnail.filename,
        images,
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
  uploadV2.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
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

    const nextThumbnail = req.files?.thumbnail?.[0];
    const nextImages = req.files?.images || [];

    if (nextThumbnail) {
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
      variant.thumbnail = nextThumbnail.filename;
    }

    if (nextImages.length > 0) {
      if (Array.isArray(variant.images)) {
        variant.images.forEach((imageName) => {
          const imgPath = path.join(process.cwd(), "uploads", "images", imageName);
          if (fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
          }
        });
      }
      variant.images = nextImages.map((file) => file.filename);
    }

    if (req.body.bulkOrders && typeof req.body.bulkOrders === "string") {
      try {
        req.body.bulkOrders = JSON.parse(req.body.bulkOrders);
      } catch (e) {
        // leave as-is; validation will handle incorrect shapes
      }
    }

    Object.keys(req.body).forEach((k) => {
      if (k === "commission") return;
      if (k === "originalPrice" || k === "discountPrice" || k === "stock") {
        variant[k] = toFiniteNumber(req.body[k], variant[k]);
        return;
      }
      if (k === "bulkOrders" && Array.isArray(req.body.bulkOrders)) {
        variant.bulkOrders = normalizeBulkOrders(
          req.body.bulkOrders,
          variant.commission ?? variant.productId?.commission ?? 0,
          variant.productId?.commission ?? 0,
          variant.bulkOrders,
        );
        return;
      }
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

router.put(
  "/update-commission/:variantId",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res) => {
    const { variantId } = req.params;
    const incomingCommission = toFiniteNumber(req.body.commission, NaN);

    if (!Number.isFinite(incomingCommission)) {
      throw new ErrorHandler("Commission amount is required", 400);
    }
    if (incomingCommission < 0) {
      throw new ErrorHandler("Commission amount cannot be negative", 400);
    }

    const variant = await ProductVariant.findById(variantId).populate({
      path: "productId",
      select: "name shopId",
    });

    if (!variant) {
      throw new ErrorHandler("Variant not found", 404);
    }

    const previousCommission = toFiniteNumber(variant.commission, 0);
    if (!Array.isArray(variant.commissionHistory)) {
      variant.commissionHistory = [];
    }

    if (previousCommission !== incomingCommission) {
      variant.commissionHistory.push({
        commission: incomingCommission,
        updatedAt: new Date(),
      });
    }

    variant.commission = incomingCommission;
    await variant.save();

    return res.status(200).json({
      success: true,
      message: "Commission amount updated successfully",
      variantId: variant._id,
      productId:
        typeof variant.productId === "object" && variant.productId
          ? variant.productId._id
          : variant.productId,
      commission: variant.commission,
    });
  }),
);

router.put(
  "/update-bulk-order-commission/:variantId/:bulkOrderId",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res) => {
    const { variantId, bulkOrderId } = req.params;
    const incomingCommission = toFiniteNumber(req.body.commission, NaN);

    if (!Number.isFinite(incomingCommission)) {
      throw new ErrorHandler("Commission amount is required", 400);
    }
    if (incomingCommission < 0) {
      throw new ErrorHandler("Commission amount cannot be negative", 400);
    }

    const variant = await ProductVariant.findById(variantId).populate({
      path: "productId",
      select: "name shopId",
    });

    if (!variant) {
      throw new ErrorHandler("Variant not found", 404);
    }

    const bulkOrder = Array.isArray(variant.bulkOrders)
      ? variant.bulkOrders.id(bulkOrderId)
      : null;

    if (!bulkOrder) {
      throw new ErrorHandler("Bulk order tier not found", 404);
    }

    const previousCommission = toFiniteNumber(
      bulkOrder.commission,
      variant.commission ?? 0,
    );
    if (!Array.isArray(bulkOrder.commissionHistory)) {
      bulkOrder.commissionHistory = [];
    }

    if (previousCommission !== incomingCommission) {
      bulkOrder.commissionHistory.push({
        commission: incomingCommission,
        updatedAt: new Date(),
      });
    }

    bulkOrder.commission = incomingCommission;
    await variant.save();

    return res.status(200).json({
      success: true,
      message: "Bulk order commission amount updated successfully",
      variantId: variant._id,
      bulkOrderId: bulkOrder._id,
      productId:
        typeof variant.productId === "object" && variant.productId
          ? variant.productId._id
          : variant.productId,
      commission: bulkOrder.commission,
    });
  }),
);

module.exports = router;
