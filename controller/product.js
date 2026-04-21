// backend/controller/product.js
const express = require("express");
const { isSeller, isAuthenticated, isAdmin, hasPermission, hasSellerPermission } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const { Product, ProductVariant } = require("../model/product");
const Order = require("../model/order");
const Shop = require("../model/shop");
const { uploadV2 } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Manufacturer = require("../model/manufacturer");
const addActivityLog = require("../utils/activityLogHelper");
const sentMailToAdmin = require("../utils/mailToAdmin");
const sendMail = require("../utils/sendMail");
const Review = require("../model/review");

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getVariantCommissionValue(variant, productCommission = null) {
  const variantCommission = toNumberOrNull(variant?.commission);
  if (variantCommission !== null) return variantCommission;

  const fallbackCommission = toNumberOrNull(productCommission);
  return fallbackCommission !== null ? fallbackCommission : 0;
}

function getBulkOrderCommissionValue(
  bulkOrder,
  variantCommission = null,
  productCommission = null,
) {
  const bulkCommission = toNumberOrNull(bulkOrder?.commission);
  if (bulkCommission !== null) return bulkCommission;

  const variantLevelCommission = toNumberOrNull(variantCommission);
  if (variantLevelCommission !== null) return variantLevelCommission;

  const productLevelCommission = toNumberOrNull(productCommission);
  return productLevelCommission !== null ? productLevelCommission : 0;
}

function normalizeCommissionHistory(history, fallbackCommission) {
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
}

function withNormalizedVariantCommission(variant, productCommission = null) {
  if (!variant) return variant;

  const normalizedVariantCommission = getVariantCommissionValue(
    variant,
    productCommission,
  );
  const variantObject = variant.toObject ? variant.toObject() : variant;
  const bulkOrders = Array.isArray(variantObject?.bulkOrders)
    ? variantObject.bulkOrders.map((bulkOrder) => ({
        ...bulkOrder,
        commission: getBulkOrderCommissionValue(
          bulkOrder,
          normalizedVariantCommission,
          productCommission,
        ),
        commissionHistory: Array.isArray(bulkOrder?.commissionHistory)
          ? bulkOrder.commissionHistory
          : [],
      }))
    : [];

  return {
    ...variantObject,
    commission: normalizedVariantCommission,
    bulkOrders,
  };
}

const VARIANT_LIST_SELECT =
  "thumbnail images originalPrice discountPrice stock colorOption size commission commissionHistory bulkOrders";

const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeBulkOrders = (
  bulkOrders,
  variantCommission = 0,
  productCommission = null,
  existingBulkOrders = [],
) => {
  if (!Array.isArray(bulkOrders)) return [];

  return bulkOrders
    .map((bulk, index) => {
      const existingBulkOrder =
        existingBulkOrders.find(
          (entry) =>
            String(entry?._id || "") !== "" &&
            String(entry?._id) === String(bulk?._id),
        ) ?? existingBulkOrders[index];

      const commission = getBulkOrderCommissionValue(
        bulk,
        variantCommission,
        productCommission,
      );

      return {
        ...(existingBulkOrder?._id ? { _id: existingBulkOrder._id } : {}),
        qty: toFiniteNumber(bulk?.qty, 0),
        price: toFiniteNumber(bulk?.price, 0),
        commission,
        commissionHistory: normalizeCommissionHistory(
          bulk?.commissionHistory ?? existingBulkOrder?.commissionHistory,
          commission,
        ),
      };
    })
    .filter((bulk) => bulk.qty > 0 && bulk.price > 0);
};

const normalizeObjectIdArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (value === undefined || value === null || value === "") {
    return [];
  }
  return [value];
};

const normalizeIncomingArray = (value) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }
  return Array.isArray(value) ? value.filter((entry) => entry !== "") : [value];
};

const parseJsonValue = (value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    return value;
  }
};

const normalizeAttributesPayload = (value) => {
  return normalizeIncomingArray(value)
    .flatMap((entry) => {
      const parsed = parseJsonValue(entry);
      if (Array.isArray(parsed)) return parsed;
      return parsed === null || parsed === undefined || parsed === "" ? [] : [parsed];
    })
    .filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry));
};

const normalizeVariantsPayload = (value) => {
  const parsed = parseJsonValue(value);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") return [parsed];
  return [];
};

const PRODUCT_UPLOAD_FIELDS = [
  { name: "images", maxCount: 5 },
  { name: "thumbnail" },
  { name: "variantImages", maxCount: 50 },
  { name: "shortVideo", maxCount: 1 },
  { name: "certificate", maxCount: 5 },
  { name: "oemLetter", maxCount: 1 },
  { name: "productComparisionSheet", maxCount: 1 },
  { name: "productCompilance", maxCount: 5 },
  { name: "msds_ifu_leaflet", maxCount: 5 },
  { name: "amc_cms", maxCount: 1 },
];

const normalizeVariantPayload = (variant, fallbackCommission = 0) => {
  const commission =
    variant?.commission === undefined || variant?.commission === null || variant?.commission === ""
      ? fallbackCommission
      : toFiniteNumber(variant.commission, fallbackCommission);

  return {
    ...variant,
    size: variant?.size ?? null,
    colorOption: variant?.colorOption ?? null,
    originalPrice: toFiniteNumber(variant?.originalPrice, 0),
    discountPrice:
      variant?.discountPrice === undefined ||
      variant?.discountPrice === null ||
      variant?.discountPrice === ""
        ? undefined
        : toFiniteNumber(variant.discountPrice, 0),
    stock: toFiniteNumber(variant?.stock, 0),
    commission,
    bulkOrders: normalizeBulkOrders(
      variant?.bulkOrders,
      commission,
      fallbackCommission,
    ),
  };
};

router.post(
  "/create-product-v2",
  isSeller,
  hasSellerPermission("AddProduct"),
  uploadV2.fields(PRODUCT_UPLOAD_FIELDS),
  catchAsyncErrors(async (req, res, next) => {
    const shopId = req.body.shopId;
    const shop = await Shop.findById(shopId);

    if (!shop) {
      throw new ErrorHandler("Shop not found", 404);
    }

    // destructure incoming fields but keep rest in product object
    const { manufacturerName, email, phone, origin, ...product } = req.body;

    // normalize & validate brand (required)
    const incomingBrand = String(req.body.brand ?? "").trim();
    if (!incomingBrand) {
      throw new ErrorHandler("Brand is required", 400);
    }
    product.brand = incomingBrand;

    // find or create manufacturer
    let manufacturer = await Manufacturer.findOne({ manufacturerName });

    if (!manufacturer) {
      manufacturer = new Manufacturer({
        manufacturerName,
        email,
        phone,
        origin,
      });
      await manufacturer.save();
    }

    product.manufacturer = manufacturer._id;

    const parsedVariants = normalizeVariantsPayload(product.variants);
    if (!parsedVariants.length) {
      throw new ErrorHandler("At least one valid product variant is required", 400);
    }
    const fallbackCommission = toFiniteNumber(product.commission, 0);
    const variants = parsedVariants.map((variant) =>
      normalizeVariantPayload(variant, fallbackCommission),
    );

    product.variants = []; // will be set after creating variant docs

    product.attributes = normalizeAttributesPayload(req.body?.attributes);
    product.category = normalizeObjectIdArray(req.body.category);
    product.subCategory = normalizeObjectIdArray(req.body.subCategory);
    product.specialityPackage = normalizeObjectIdArray(req.body.specialityPackage);
    product.specialityPackageType = normalizeObjectIdArray(req.body.specialityPackageType);
    product.tags = normalizeIncomingArray(req.body.tags);
    product.crosssells = normalizeIncomingArray(req.body.crosssells);
    product.upsells = normalizeIncomingArray(req.body.upsells);

    // files -> attach filenames where applicable (defensive checks)
    const legacyProductImages =
      req.files && req.files.images
        ? req.files.images.map((e) => e.filename)
        : [];
    if (req.files && req.files.thumbnail) {
      // thumbnail may be an array; attach to variant thumbnails where appropriate
      req.files.thumbnail.forEach((el, i) => {
        variants[i].thumbnail = el.filename;
      });
    }
    if (req.files && req.files.variantImages) {
      let imageCursor = 0;
      variants.forEach((variant, index) => {
        const imageCount = toFiniteNumber(parsedVariants[index]?.imagesCount, 0);
        variant.images = req.files.variantImages
          .slice(imageCursor, imageCursor + imageCount)
          .map((file) => file.filename);
        imageCursor += imageCount;
      });
    }
    if (legacyProductImages.length > 0 && variants[0]) {
      const existingImages = Array.isArray(variants[0].images) ? variants[0].images : [];
      variants[0].images = Array.from(new Set([...existingImages, ...legacyProductImages]));
    }
    product.images = Array.isArray(variants[0]?.images) ? variants[0].images : [];
    if (req.files && req.files.shortVideo) {
      product.shortVideo = req.files.shortVideo[0].filename;
    }
    if (req.files && req.files.certificate) {
      product.certificate = req.files.certificate.map((c) => c.filename);
    }
    if (req.files && req.files.oemLetter) {
      product.oemLetter = req.files.oemLetter[0].filename;
    }
    if (req.files && req.files.productComparisionSheet) {
      product.productComparisionSheet =
        req.files.productComparisionSheet[0].filename;
    }
    if (req.files && req.files.productCompilance) {
      product.productCompilance = req.files.productCompilance.map(
        (e) => e.filename,
      );
    }
    if (req.files && req.files.msds_ifu_leaflet) {
      product.msds_ifu_leaflet = req.files.msds_ifu_leaflet.map(
        (e) => e.filename,
      );
    }
    if (req.files && req.files.amc_cms) {
      product.amc_cms = req.files.amc_cms[0].filename;
    }

    // --- DEBUG logs (helpful while testing) ---
    // console.log("create-product payload keys:", Object.keys(req.body));
    // console.log("create-product normalized product.brand:", product.brand);

    // Create product document
    const savedProduct = await Product.create(product);

    const savedVariants = await ProductVariant.insertMany(
      variants.map((v) => {
        const commission = getVariantCommissionValue(v, savedProduct.commission);
        return {
          ...v,
          productId: savedProduct._id,
          commission,
          commissionHistory: [
            {
              commission,
              updatedAt: new Date(),
            },
          ],
        };
      }),
    );

    savedProduct.variants = savedVariants.map((v) => v._id);
    savedProduct.commission = savedVariants[0]?.commission ?? savedProduct.commission;

    // initial commission history
    savedProduct.commissionHistory = [
      {
        commission: savedProduct.commission,
        updatedAt: new Date(),
      },
    ];

    await savedProduct.save();
    await addActivityLog({
      userId: shopId,
      userType: "Shop",
      action: "Product Add",
      entityType: "Product",
      entityId: savedProduct._id,
      description:
        shop.businessName + " added the product " + savedProduct.name,
    });

    res.status(201).json(savedProduct);
  }),
);

/* ------------------ SELLER: get all products of a shop (seller portal) ------------------ */
/* This returns all products for a shop (used in seller portal). Not filtered by public visibility. */
router.get(
  "/get-all-products-shop/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({ shopId: req.params.id })
        .sort({ createdAt: -1 })
        .populate("variants")
        .populate("reviews", "rating") // 🔥 populate only rating
        .select(
          "name variants createdAt commission sku visibilityByAdmin visibilityBySeller commissionHistory reviews badge"
        )
        .lean();

      const productsWithRatings = products.map((product) => {
        const avgRating =
          product.reviews && product.reviews.length > 0
            ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
              product.reviews.length
            : 0;

        return {
          ...product,
          variants: Array.isArray(product.variants)
            ? product.variants.map((variant) =>
                withNormalizedVariantCommission(variant, product.commission),
              )
            : [],
          avgRating: parseFloat(avgRating.toFixed(1)),
        };
      });

      res.status(200).json({
        success: true,
        products: productsWithRatings,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);


/* ------------------ PUBLIC: get visible products of a shop (user portal) ------------------ */
router.get(
  "/get-public-products-shop/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({
        shopId: req.params.id,
        visibilityByAdmin: true,
        visibilityBySeller: true,
      })
        .sort({ createdAt: -1 })
        .populate("variants")
        .populate("reviews", "rating")
        .select(
          "name variants createdAt commission sku visibilityByAdmin visibilityBySeller commissionHistory reviews badge"
        )
        .lean();

      const productsWithRatings = products.map((product) => {
        const avgRating =
          product.reviews && product.reviews.length > 0
            ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
              product.reviews.length
            : 0;

        return {
          ...product,
          variants: Array.isArray(product.variants)
            ? product.variants.map((variant) =>
                withNormalizedVariantCommission(variant, product.commission),
              )
            : [],
          avgRating: parseFloat(avgRating.toFixed(1)),
        };
      });

      res.status(200).json({
        success: true,
        products: productsWithRatings,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);


router.get(
  "/getallproducts/outofstock/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({ shopId: req.params.id })
        .sort({ createdAt: -1 })
        .populate({
          path: "variants",
          match: { stock: 0 },
          select: VARIANT_LIST_SELECT,
        })
        .select(
          "name variants createdAt commission sku visibilityByAdmin visibilityBySeller commissionHistory"
        );

      const filteredProducts = products.filter(
        product => product.variants && product.variants.length > 0
      );

      res.status(200).json({
        success: true,
        products: filteredProducts,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message || error, 400));
    }
  })
);

router.get(
  "/getallproducts/bufferstock/:id",
  catchAsyncErrors,
  (async (req, res, next) => {
    try {
      const products = await Product.find({ shopId: req.params.id })
        .sort({ createdAt: -1 })
        .populate({
          path: "variants",
          select: VARIANT_LIST_SELECT,
        })
        .select(
          "name variants createdAt commission sku visibilityByAdmin visibilityBySeller commissionHistory minmaxrule"
        );

      const lowStockProducts = products.filter((product) => {
        if (!product.minmaxrule) return false;

        let minQty;
        try {
          const rule = JSON.parse(product.minmaxrule);
          minQty = Number(rule?.minQty);
          if (!minQty || minQty <= 0) return false;
        } catch (err) {
          return false;
        }

        return product.variants.some(
          (variant) =>
            variant.stock > 0 && variant.stock < minQty
        );
      });

      res.status(200).json({
        success: true,
        products: lowStockProducts,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message || error, 400));
    }
  })
);


/* ------------------ SELLER: delete product ------------------ */
router.delete(
  "/delete-shop-product/:id",
  isSeller,
  hasSellerPermission("AllProducts"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const productId = req.params.id;

      const productData = await Product.findById(productId);

      if (productData && Array.isArray(productData.images)) {
        productData.images.forEach((imageUrl) => {
          const filename = imageUrl;
          const filePath = `uploads/${filename}`;

          fs.unlink(filePath, (err) => {
            if (err) {
              console.log(err);
            }
          });
        });
      }

      const product = await Product.findByIdAndDelete(productId);

      if (!product) {
        return next(new ErrorHandler("Product not found with this id!", 500));
      }

      res.status(200).json({
        success: true,
        message: "Product Deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  }),
);

/* ------------------ PUBLIC: get all products (user portal) ------------------ */
router.get(
  "/get-all-products",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({
         visibilityByAdmin: true,
        visibilityBySeller: true,
      })
        .populate("shopId", "name")
        .populate({
          path: "variants",
          model: "ProductVariant",
          select: VARIANT_LIST_SELECT,
        })
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  }),
);

router.get(
  "/all-products",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({
        visibilityByAdmin: true,
        visibilityBySeller: true,
      })
        .populate("shopId", "name")
        .populate({
          path: "manufacturer",
          select: "manufacturerName email phone origin",
        })
        .populate({
          path: "variants",
          model: "ProductVariant",
          select: VARIANT_LIST_SELECT,
        })
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  }),
);

router.get(
  "/get-out-of-stock-products",
  isAuthenticated,
  hasPermission("StockManagement"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({
         visibilityByAdmin: true,
        visibilityBySeller: true,
      })
        .populate("shopId", "businessName")
        .populate({
          path: "variants",
          select: VARIANT_LIST_SELECT,
        })
        .sort({ createdAt: -1 });

      const outOfStockProducts = products.filter((product) =>
        product.variants.some((variant) => variant.stock === 0)
      );

      res.status(200).json({
        success: true,
        products: outOfStockProducts,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);


router.get(
  "/get-low-stock-products",
  isAuthenticated,
  hasPermission("StockManagement"),
  
  catchAsyncErrors  (async (req, res, next) => {
    try {
      const products = await Product.find({
         visibilityByAdmin: true,
        visibilityBySeller: true,
      })
        .populate("shopId", "businessName")
        .populate({
          path: "variants",
          select: VARIANT_LIST_SELECT,
        })
        .sort({ createdAt: -1 });

      const lowStockProducts = products.filter((product) => {
        if (!product.minmaxrule) return false;

        let minQty = 0;
        try {
          const rule = JSON.parse(product.minmaxrule);
          minQty = Number(rule.minQty || 0);
        } catch (err) {
          return false;
        }

        return product.variants.some(
          (variant) => variant.stock > 0 && variant.stock < minQty
        );
      });

      res.status(200).json({
        success: true,
        products: lowStockProducts,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);


router.get(
  "/get-all-products-updated-random",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.aggregate([
        {
          $match: {
            visibilityByAdmin: true,
            visibilityBySeller: true,
          },
        },
        { $sample: { size: 10 } }, // ✅ true random selection
      ]);

      // Populate after aggregation
      const populatedProducts = await Product.populate(products, [
        { path: "shopId", select: "name" },
        {
          path: "variants",
          select:
            "thumbnail originalPrice discountPrice stock colorOption size commission bulkOrders badge",
        },
        {
          path: "reviews",
          select: "rating",
        },
      ]);

      const finalProducts = populatedProducts.map((product) => {
        const avgRating =
          product.reviews && product.reviews.length > 0
            ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
              product.reviews.length
            : 0;

        const { reviews, ...rest } = product;

        return {
          ...rest,
          avgRating: parseFloat(avgRating.toFixed(1)),
        };
      });

      res.status(200).json({
        success: true,
        products: finalProducts,
      });

    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);



/* ------------------ PUBLIC: filtered product lists (by type) ------------------ */
router.get(
  "/get-consumable-products",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({
        productType: "Consumables",
        visibilityByAdmin: true,
        visibilityBySeller: true,
      }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message || error, 400));
    }
  }),
);

router.get(
  "/get-equipment-products",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({
        productType: "Equipment",
        visibilityByAdmin: true,
        visibilityBySeller: true,
      }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message || error, 400));
    }
  }),
);

router.get(
  "/get-pharmaceutical-products",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({
        productType: "Pharmaceutical",
        visibilityByAdmin: true,
        visibilityBySeller: true,
      }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message || error, 400));
    }
  }),
);

/* ------------------ PUBLIC: product detail (user) ------------------ */
router.get(
  "/get-product/:id",
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return next(new ErrorHandler("Invalid product id", 400));
    }

    try {
      // 1️⃣ Fetch product and populate basic references
      const product = await Product.findById(id)
        .select("-reviews")
        .populate("shopId variants manufacturer");

      if (!product) return next(new ErrorHandler("Product not found", 404));

      // Ensure attributes exist (defensive)
      product.attributes = product.attributes || [];
      product.brand = product.brand || null;
      const normalizedProduct = product.toObject();
      normalizedProduct.isAvailableToOrder =
        normalizedProduct.visibilityByAdmin === true &&
        normalizedProduct.visibilityBySeller === true;
      normalizedProduct.variants = Array.isArray(normalizedProduct.variants)
        ? normalizedProduct.variants.map((variant) =>
            withNormalizedVariantCommission(variant, normalizedProduct.commission),
          )
        : [];

      // 2️⃣ Fetch reviews for this product
      const reviewStats = await Review.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(id) } },
        {
          $group: {
            _id: null,
            reviewsCount: { $sum: 1 },
            avgRating: { $avg: "$rating" },
          },
        },
      ]);

      const reviewsCount = reviewStats?.[0]?.reviewsCount ?? 0;
      const avgRatingRaw = reviewStats?.[0]?.avgRating ?? product.ratings ?? 0;
      const avgRating = Number(Number(avgRatingRaw).toFixed(1));

      res.status(200).json({
        ...normalizedProduct,
        avgRating,
        reviewsCount,
        reviews: [],
      });
    } catch (error) {
      console.error(error);
      return next(new ErrorHandler(error.message || error, 400));
    }
  })
);


/* ------------------ PUBLIC: product reviews (paginated) ------------------ */
router.get(
  "/get-product-reviews/:id",
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const limit = Math.min(Math.max(parseInt(req.query.limit || "5", 10), 1), 20);
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const skip = (page - 1) * limit;

    if (!mongoose.isValidObjectId(id)) {
      return next(new ErrorHandler("Invalid product id", 400));
    }

    const product = await Product.findById(id).select("_id");

    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    const [reviews, total] = await Promise.all([
      Review.find({ productId: id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name firstName lastName")
        .select("rating comment images user createdAt")
        .lean(),
      Review.countDocuments({ productId: id }),
    ]);

    const hasMore = skip + reviews.length < total;

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        page,
        limit,
        total,
        hasMore,
        nextPage: hasMore ? page + 1 : null,
      },
    });
  })
);
/* ------------------ AUTH: create review (user) ------------------ */
router.put(
  "/create-new-review",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { user, rating, comment, productId, orderId } = req.body;

      const product = await Product.findById(productId);
      if (!product) return next(new ErrorHandler("Product not found", 404));

      const review = {
        user,
        rating,
        comment,
        productId,
      };

      const isReviewed = product.reviews.find(
        (rev) => String(rev.user._id) === String(req.user._id),
      );

      if (isReviewed) {
        product.reviews.forEach((rev) => {
          if (String(rev.user._id) === String(req.user._id)) {
            rev.rating = rating;
            rev.comment = comment;
            rev.user = user;
          }
        });
      } else {
        product.reviews.push(review);
      }

      let avg = 0;
      product.reviews.forEach((rev) => {
        avg += rev.rating;
      });

      product.ratings = avg / product.reviews.length;

      await product.save({ validateBeforeSave: false });

      if (orderId) {
        await Order.findByIdAndUpdate(
          orderId,
          { $set: { "cart.$[elem].isReviewed": true } },
          { arrayFilters: [{ "elem._id": productId }], new: true },
        );
      }

      res.status(200).json({
        success: true,
        message: "Reviewed successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message || error, 400));
    }
  }),
);

/* ------------------ ADMIN: admin-all-products (for admin portal) ------------------ */
router.get(
  "/admin-all-products",
  isAuthenticated,
  hasPermission("AllProducts"),
  catchAsyncErrors(async (req, res, next) => {

    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "variants",
        select: VARIANT_LIST_SELECT,
      })
      .populate("shopId", "businessName")
      .populate("reviews", "rating") // 🔥 populate review ratings
      .select(
        "name variants createdAt commission sku visibilityByAdmin visibilityBySeller badge reviews"
      )
      .lean();

    const productsWithRatings = products.map((product) => {

      const avgRating =
        product.reviews && product.reviews.length > 0
          ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
            product.reviews.length
          : 0;

      return {
        ...product,
        variants: Array.isArray(product.variants)
          ? product.variants.map((variant) =>
              withNormalizedVariantCommission(variant, product.commission),
            )
          : [],
        avgRating: parseFloat(avgRating.toFixed(1)),
      };
    });

    res.status(200).json({
      success: true,
      products: productsWithRatings,
    });

  })
);

/* ------------------ PUBLIC SEARCH (user portal) ------------------ */
router.get(
  "/search",
  catchAsyncErrors(async (req, res, next) => {
    const { q } = req.query;
    if (!q) {
      return res.status(200).json({ success: true, products: [] });
    }

    const term = String(q).trim();
    const regex = new RegExp(
      term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
      "i",
    );

    const products = await Product.find({
      visibilityByAdmin: true,
      visibilityBySeller: true,
      $or: [{ name: regex }, { manufacturerName: regex }],
    })
      .populate("category", "name")
      .populate({
        path: "variants",
        model: "ProductVariant",
        select: VARIANT_LIST_SELECT,
      })
      .lean();

    // additionally filter by category name if needed (case where category is populated)
    const finalProducts = products.filter((p) => {
      if (!p) return false;
      if (regex.test(p.name || "")) return true;
      if (p.manufacturerName && regex.test(p.manufacturerName)) return true;
      if (Array.isArray(p.category)) {
        if (p.category.some((c) => c && regex.test(String(c.name || ""))))
          return true;
      } else if (
        p.category &&
        p.category.name &&
        regex.test(String(p.category.name))
      )
        return true;
      return false;
    });

    return res.status(200).json({ success: true, products: finalProducts });
  }),
);

/* ------------------ SELLER SEARCH (seller portal) ------------------ */
router.get(
  "/searchseller",
  catchAsyncErrors(async (req, res, next) => {
    const { q, shopId } = req.query;

    if (!shopId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing shopId" });
    }

    // no query => return all products of shop
    if (!q || String(q).trim().length === 0) {
      const products = await Product.find({
        shopId: String(shopId),
        visibilityByAdmin: true,
        visibilityBySeller: true,
      })
        .sort({ createdAt: -1 })
        .populate("variants")
        .populate("category", "name")
        .lean();

      return res.status(200).json({ success: true, products });
    }

    const qStr = String(q);
    const regex = new RegExp(
      qStr.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
      "i",
    );

    const products = await Product.find({
      shopId: String(shopId),
      visibilityByAdmin: true,
      visibilityBySeller: true,
      $or: [{ name: regex }, { manufacturerName: regex }],
    })
      .populate("variants")
      .populate("category", "name")
      .lean();

    // final in-memory filter covering category.name
    const finalProducts = products.filter((p) => {
      const catName =
        p.category && p.category.name ? String(p.category.name) : "";
      if (regex.test(catName)) return true;
      return true; // keep product if already matched name/manufacturer
    });

    return res.status(200).json({ success: true, products: finalProducts });
  }),
);

/* ------------------ PUBLIC: get-products-by-subcategory (user) ------------------ */
router.get(
  "/get-products-by-subcategory/:subCategoryId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { subCategoryId } = req.params;

      if (!mongoose.isValidObjectId(subCategoryId)) {
        return res.status(400).json({ message: "Invalid subCategoryId" });
      }

      let products = await Product.find({
        subCategory: subCategoryId,
        visibilityByAdmin: true,
        visibilityBySeller: true,
      })
        .select(
          "name variants shopId manufacturer manufacturerName email phone origin reviews"
        )
        .populate("shopId")
        .populate({
          path: "manufacturer",
          select: "manufacturerName email phone origin",
        })
        .populate({
          path: "variants",
          select:
            VARIANT_LIST_SELECT,
        })
        .populate("reviews", "rating") // ✅ populate rating only
        .lean();

      if (!products || products.length === 0) {
        return res.status(200).json([]);
      }

      // ✅ Normalize manufacturer safely
      products = products.map((p) => {
        if (!p.manufacturer || typeof p.manufacturer !== "object") {
          p.manufacturer = {
            manufacturerName: p.manufacturerName ?? "Unknown",
            email: p.email ?? "",
            phone: p.phone ?? "",
            origin: p.origin ?? "",
            _id: null,
          };
        }
        return p;
      });

      // ✅ Add avgRating per product
      const finalProducts = products.map((product) => {
        const avgRating =
          product.reviews && product.reviews.length > 0
            ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
              product.reviews.length
            : 0;

        const { reviews, ...rest } = product;

        return {
          ...rest,
          avgRating: parseFloat(avgRating.toFixed(1)),
        };
      });

      return res.status(200).json(finalProducts);

    } catch (error) {
      next(error);
    }
  })
);



/* ------------------ PUBLIC: get-products-by-category (user) ------------------ */
// GET /api/.../get-products-by-category/:CategoryId
router.get("/get-products-by-category/:CategoryId", async (req, res, next) => {
  try {
    const { CategoryId } = req.params;

    if (!mongoose.isValidObjectId(CategoryId)) {
      return res.status(400).json({ message: "Invalid CategoryId" });
    }

    let products = await Product.find({
      category: CategoryId,
      visibilityByAdmin: true,
      visibilityBySeller: true,
    })
      .select(
        "name variants shopId manufacturer manufacturerName email phone origin reviews createdAt"
      )
      .populate("shopId")
      .populate({
        path: "manufacturer",
        select: "manufacturerName email phone origin",
      })
      .populate({
        path: "variants",
        select:
          VARIANT_LIST_SELECT,
      })
      .populate("reviews", "rating") // ✅ populate ratings
      .lean();

    if (!products || products.length === 0) {
      return res.status(200).json([]);
    }

    const finalProducts = products.map((product) => {
      // ✅ Normalize manufacturer safely
      if (!product.manufacturer || typeof product.manufacturer !== "object") {
        product.manufacturer = {
          manufacturerName: product.manufacturerName ?? "Unknown",
          email: product.email ?? "",
          phone: product.phone ?? "",
          origin: product.origin ?? "",
          _id: null,
        };
      }

      // ✅ Calculate avg rating
      const avgRating =
        product.reviews && product.reviews.length > 0
          ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
            product.reviews.length
          : 0;

      const { reviews, ...rest } = product;

      return {
        ...rest,
        avgRating: parseFloat(avgRating.toFixed(1)),
      };
    });

    return res.status(200).json(finalProducts);

  } catch (error) {
    next(error);
  }
});



/* ------------------ PUBLIC: speciality package endpoints (user) ------------------ */
router.get(
  "/get-products-by-speciality-package/:specialityPackageId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { specialityPackageId } = req.params;

      if (!mongoose.isValidObjectId(specialityPackageId)) {
        return res.status(400).json({ message: "Invalid specialityPackageId" });
      }

      const products = await Product.find({
        specialityPackage: { $in: [specialityPackageId] },
        visibilityByAdmin: true,
        visibilityBySeller: true,
      })
        .select("name variants shopId reviews createdAt")
        .populate("shopId")
        .populate({
          path: "variants",
          select:
            VARIANT_LIST_SELECT,
        })
        .populate("reviews", "rating") // ✅ get only rating
        .lean();

      const finalProducts = products.map((product) => {
        const avgRating =
          product.reviews && product.reviews.length > 0
            ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
              product.reviews.length
            : 0;

        const { reviews, ...rest } = product;

        return {
          ...rest,
          avgRating: parseFloat(avgRating.toFixed(1)),
        };
      });

      res.status(200).json(finalProducts);

    } catch (error) {
      next(error);
    }
  })
);


router.get(
  "/get-products-by-speciality-package-type/:specialityPackageTypeId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { specialityPackageTypeId } = req.params;

      if (!mongoose.isValidObjectId(specialityPackageTypeId)) {
        return res
          .status(400)
          .json({ message: "Invalid specialityPackageTypeId" });
      }

      const products = await Product.find({
        specialityPackageType: { $in: [specialityPackageTypeId] },
        visibilityByAdmin: true,
        visibilityBySeller: true,
      })
        .select("name variants shopId reviews createdAt")
        .populate("shopId")
        .populate({
          path: "variants",
          select:
            VARIANT_LIST_SELECT,
        })
        .populate("reviews", "rating") // ✅ populate rating only
        .lean();

      const finalProducts = products.map((product) => {
        const avgRating =
          product.reviews && product.reviews.length > 0
            ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
              product.reviews.length
            : 0;

        const { reviews, ...rest } = product;

        return {
          ...rest,
          avgRating: parseFloat(avgRating.toFixed(1)),
        };
      });

      res.status(200).json(finalProducts);

    } catch (error) {
      next(error);
    }
  })
);


/* ------------------ UPLOAD / UPDATE helpers (admin/seller) ------------------ */
router.put(
  "/upload-doc/:productId",
  isSeller,
  hasSellerPermission("AllProducts"),
  uploadV2.single("file"),
  catchAsyncErrors(async (req, res) => {
    const { productId } = req.params;
    const { docType, idx } = req.body;

    if (!productId || !docType) {
      throw new ErrorHandler("productId and docType are required", 400);
    }

    const product = await Product.findById(productId);

    if (!product) {
      throw new ErrorHandler("Product not found", 404);
    }
    if (req.seller._id.toString() !== product.shopId.toString()) {
      throw new ErrorHandler("Not authorized", 402);
    }

    const metaData = {};
    metaData[docType] = {
      oldValue: product[docType],
    };
    // Delete old file if exists
    const oldFile =
      idx !== undefined ? product[docType][parseInt(idx)] : product[docType];
    if (oldFile) {
      const oldPath = path.join(process.cwd(),"uploads","docs", oldFile);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Save new file
    const filePath = req.file.filename;
    if (idx !== undefined) {
      product[docType][idx] = filePath;
    } else {
      product[docType] = filePath;
    }

    metaData[docType].newValue = product[docType];

    await product.save();
    await addActivityLog({
      userId: req.seller._id,
      userType: "Shop",
      action: "Product Update",
      entityType: "Product",
      entityId: product._id,
      description:
        req.seller.businessName + " updated the product document " + docType,
      metaData: metaData,
    });

    res.status(200).json({
      success: true,
      message: "Document replaced successfully",
      product,
    });
  }),
);

router.put(
  "/upload-image/:productId",
  isSeller,
  hasSellerPermission("AllProducts"),
  uploadV2.single("images"),
  catchAsyncErrors(async (req, res) => {
    const { productId } = req.params;
    const { idx } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const metaData = {
      images: {
        oldValue: product.images,
      },
    };

    const oldFile = idx !== undefined ? product.images[parseInt(idx)] : null;
    if (oldFile) {
      const oldPath = path.join(process.cwd(),"uploads","images", oldFile);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // add new image
    if (idx !== undefined) {
      product.images[parseInt(idx)] = req.file.filename;
    } else {
      product.images.push(req.file.filename);
    }

    await product.save();

    metaData.images.newValue = product.images;
    await addActivityLog({
      userId: req.seller._id,
      userType: "Shop",
      action: "Product Update",
      entityType: "Product",
      entityId: product._id,
      description: req.seller.businessName + " updated the product images",
      metaData: metaData,
    });

    res.json({ success: true, product });
  }),
);

/* ------------------ UPDATE PRODUCT (admin/seller) ------------------ */
// Replace existing route handler temporarily with this debug version
// TEMP DEBUG handler - no multer
// Replace existing PUT /update-product/:productId with this
router.put(
  "/update-product/:productId",
  isSeller,
  hasSellerPermission("AllProducts"),
  uploadV2.fields(PRODUCT_UPLOAD_FIELDS),
  catchAsyncErrors(async (req, res) => {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) throw new ErrorHandler("product not found", 404);

    const updates = req.body || {};
    if (Object.prototype.hasOwnProperty.call(updates, "category")) {
      updates.category = normalizeObjectIdArray(updates.category);
    }
    if (Object.prototype.hasOwnProperty.call(updates, "subCategory")) {
      updates.subCategory = normalizeObjectIdArray(updates.subCategory);
    }
    if (Object.prototype.hasOwnProperty.call(updates, "tags")) {
      updates.tags = normalizeIncomingArray(updates.tags);
    }
    if (Object.prototype.hasOwnProperty.call(updates, "crosssells")) {
      updates.crosssells = normalizeIncomingArray(updates.crosssells);
    }
    if (Object.prototype.hasOwnProperty.call(updates, "upsells")) {
      updates.upsells = normalizeIncomingArray(updates.upsells);
    }
    if (Object.prototype.hasOwnProperty.call(updates, "specialityPackage")) {
      updates.specialityPackage = normalizeObjectIdArray(updates.specialityPackage);
    }
    if (Object.prototype.hasOwnProperty.call(updates, "specialityPackageType")) {
      updates.specialityPackageType = normalizeObjectIdArray(updates.specialityPackageType);
    }
    if (Object.prototype.hasOwnProperty.call(updates, "attributes")) {
      updates.attributes = normalizeAttributesPayload(updates.attributes);
    }

    if (req.files?.shortVideo?.[0]) {
      updates.shortVideo = req.files.shortVideo[0].filename;
    }
    if (req.files?.certificate) {
      updates.certificate = req.files.certificate.map((file) => file.filename);
    }
    if (req.files?.oemLetter?.[0]) {
      updates.oemLetter = req.files.oemLetter[0].filename;
    }
    if (req.files?.productComparisionSheet?.[0]) {
      updates.productComparisionSheet = req.files.productComparisionSheet[0].filename;
    }
    if (req.files?.productCompilance) {
      updates.productCompilance = req.files.productCompilance.map((file) => file.filename);
    }
    if (req.files?.msds_ifu_leaflet) {
      updates.msds_ifu_leaflet = req.files.msds_ifu_leaflet.map((file) => file.filename);
    }
    if (req.files?.amc_cms?.[0]) {
      updates.amc_cms = req.files.amc_cms[0].filename;
    }
    if (req.files?.images) {
      updates.images = req.files.images.map((file) => file.filename);
    }

    const metaData = {};
    Object.keys(updates).forEach((k) => {
      if (product[k] !== updates[k]) {
        metaData[k] = {
          newValue: updates[k],
          oldValue: product[k],
        };
      }
      product[k] = updates[k];
    });

    await product.save();
    await addActivityLog({
      userId: req.seller._id,
      userType: "Shop",
      action: "Product Update",
      entityType: "Product",
      entityId: product._id,
      description: req.seller.businessName + " updated the product field",
      metaData: metaData,
    });
    res.json({ success: true });
  }),
);

/* ------------------ COMMISSION (admin) ------------------ */
router.put(
  "/update-commission/:variantId",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res) => {
    const variant = await ProductVariant.findById(req.params.variantId).populate({
      path: "productId",
      populate: [{ path: "shopId" }, { path: "variants" }],
    });
    if (!variant) throw new ErrorHandler("Variant not found", 404);
    const product = variant.productId;
    if (!product) throw new ErrorHandler("Product not found", 404);
    if (!product.shopId) throw new ErrorHandler("Product shop not found", 404);
    if (req.body.commission === undefined || req.body.commission === null || req.body.commission === "")
      throw new ErrorHandler("Commission is required", 403);

    const nextCommission = toFiniteNumber(
      req.body.commission,
      variant.commission ?? product.commission,
    );
    const previousCommission = toFiniteNumber(variant.commission, product.commission ?? 0);
    variant.commissionHistory = Array.isArray(variant.commissionHistory)
      ? variant.commissionHistory
      : [];

    const metaData = {
      commission: {
        oldValue: previousCommission,
        newValue: nextCommission,
      },
    };

    variant.commission = nextCommission;
    variant.commissionHistory.push({
      commission: nextCommission,
      updatedAt: new Date(),
    });
    await variant.save();

    await addActivityLog({
      userId: req.user._id,
      userType: "User",
      action: "Sema-Commission Update",
      entityType: "ProductVariant",
      entityId: variant._id,
      description:
        "Admin updated the sema-commission for the product variant: " + product.name,
      metaData: metaData,
    });

    const sellerMail = product.shopId.email
    const emailSubject="Product Commission Update"
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-width: 600px; margin: auto;">
        <h2 style="color: #2c3e50;">
          Product Commission Updated
        </h2>
        <p style="font-size: 15px;">
          Hello,
        </p>
        <p style="font-size: 15px;">
          The commission for the following product has been <strong>updated by the admin</strong>.
        </p>
        <div style="margin-top: 20px; padding: 15px; background: #f7f7f7; border-left: 4px solid #f39c12;">
          <p><strong>Product ID:</strong> ${product._id}</p>
          <p><strong>Variant ID:</strong> ${variant._id}</p>
          <p><strong>Product Name:</strong> ${product.name}</p>
          <p><strong>Updated Commission Amount:</strong> ${variant.commission}</p>
        </div>
        <p style="margin-top: 20px; font-size: 14px;">
          This update will apply to all future orders of this product.
        </p>
      </div>
    `;

    await sendMail({email:sellerMail,subject:emailSubject,html:htmlBody })

    res.status(200).json({ success: true, commission: variant.commission });
  }),
);

router.get("/get-products-by-category/:CategoryId", async (req, res, next) => {
  try {
    const { CategoryId } = req.params;

    if (!mongoose.isValidObjectId(CategoryId)) {
      return res.status(400).json({ message: "Invalid CategoryId" });
    }
    const products = await Product.find({
      category: CategoryId,
      visibilityByAdmin: true,
      visibilityBySeller: true,
    })
      .populate("shopId")
      .populate({
        path: "variants",
        select: VARIANT_LIST_SELECT,
      })
      .lean();

    if (!products || products.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
});

router.get(
  "/searchseller",
  catchAsyncErrors(async (req, res, next) => {
    const { q, shopId } = req.query;

    // require shopId (we expect sellers to always pass it)
    if (!shopId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing shopId" });
    }

    // if no query, return all products for this shop (sorted newest first)
    if (!q || String(q).trim().length === 0) {
      const products = await Product.find({
        shopId: String(shopId),
        visibilityByAdmin: true,
        visibilityBySeller: true,
      })
        .sort({ createdAt: -1 })
        .populate("variants")
        .populate("category", "name")
        .lean();

      return res.status(200).json({ success: true, products });
    }

    // safe-escape q to a case-insensitive regex
    const qStr = String(q);
    const regex = new RegExp(
      qStr.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
      "i",
    );

    // search by name, manufacturerName, category.name
    // ensure we always filter by shopId
    const products = await Product.find({
      shopId: String(shopId),
      visibilityByAdmin: true,
      visibilityBySeller: true,
      $or: [
        { name: regex },
        { manufacturerName: regex },
        // category might be a ref — use populate after or query by populated field using $lookup-like approach.
        // However, mongoose allows querying on populated field if you store category name in document
        // For reliability, we attempt to match category.name after populating below by using aggregation fallback.
      ],
    })
      .populate("variants")
      .populate("category", "name")
      .lean();

    // If you need strict category.name search that works even if category is a ref,
    // the populate above will pull category.name and the regex on category.name in the initial query
    // may not match — that's why we do an in-memory filter on populated category.name as well:
    const finalProducts = products.filter((p) => {
      // check populated category.name
      const catName =
        p.category && p.category.name ? String(p.category.name) : "";
      if (regex.test(catName)) return true;

      // already matched name/manufacturer via DB $or
      // but safe return true (product included)
      return true;
    });

    return res.status(200).json({ success: true, products: finalProducts });
  }),
);

router.put(
  "/admin-visibility",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    const { productIds, isVisible } = req.body;
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { visibilityByAdmin: isVisible } },
    );
    res.json({ success: true });
  }),
);

router.put(
  "/seller-visibility",
  isSeller,
  catchAsyncErrors(async (req, res) => {
    const { productIds, isVisible } = req.body;
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { visibilityBySeller: isVisible } },
    );
    res.json({ success: true });
  }),
);

/* ------------------ DELETE DOCUMENT (admin/seller) ------------------ */
router.delete(
  "/delete-doc/:productId",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;
    const { docType, idx } = req.body; // idx is passed for array fields

    const product = await Product.findById(productId);

    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    // Authorization check
    if (req.seller._id.toString() !== product.shopId.toString()) {
      return next(new ErrorHandler("Not authorized", 402));
    }

    let fileToDelete = "";
    const metaData = { [docType]: { oldValue: product[docType] } };

    // Case 1: Deleting from an Array (e.g., msds_ifu_leaflet)
    if (idx !== undefined && Array.isArray(product[docType])) {
      fileToDelete = product[docType][idx];
      product[docType].splice(idx, 1); // Remove specifically that index
    } 
    // Case 2: Deleting a single field (e.g., oemLetter)
    else {
      fileToDelete = product[docType];
      product[docType] = ""; // Clear the field
    }

    // Physically delete file from server
    if (fileToDelete) {
      const filePath = path.join(process.cwd(), "uploads", "docs", fileToDelete);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await product.save();

    // Log the activity
    metaData[docType].newValue = product[docType];
    await addActivityLog({
      userId: req.seller._id,
      userType: "Shop",
      action: "Product Update",
      entityType: "Product",
      entityId: product._id,
      description: `${req.seller.businessName} deleted document: ${docType}`,
      metaData: metaData,
    });

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
      product,
    });
  })
);


// Query params:
// - shopId (optional): filter by shop
// - limit (optional): number of products to return (default 10, max 100)
// - skip (optional): for pagination offset
// - qtyWeight (optional): weight for totalOrderedQuantity (default 1)
// - ordersWeight (optional): weight for totalOrders (default 5)
router.get(
  "/best-sellers",
  catchAsyncErrors(async (req, res, next) => {
    try {
      // parse & sanitize query params
      const {
        shopId,
        category: categoryParam, // supports single id or comma-separated list
        limit: limitQ,
        skip: skipQ,
        qtyWeight: qtyWeightQ,
        ordersWeight: ordersWeightQ,
      } = req.query;

      const limit = Math.min(Math.max(parseInt(limitQ || "10", 10), 1), 100);
      const skip = Math.max(parseInt(skipQ || "0", 10), 0);
      const qtyWeight = parseFloat(qtyWeightQ ?? "1");
      const ordersWeight = parseFloat(ordersWeightQ ?? "5");

      const pipeline = [];

      // Build match object
      const match = {
        visibilityByAdmin: true,
        visibilityBySeller: true,
      };

      if (shopId) {
        if (!mongoose.isValidObjectId(String(shopId))) {
          return next(new ErrorHandler("Invalid shopId", 400));
        }
        match.shopId = new mongoose.Types.ObjectId(String(shopId));
      }

      if (categoryParam) {
        const catIds = categoryParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((id) => {
            if (!mongoose.isValidObjectId(id)) {
              throw new ErrorHandler(`Invalid category id: ${id}`, 400);
            }
            return new mongoose.Types.ObjectId(id);
          });

        match.category = catIds.length > 1 ? { $in: catIds } : catIds[0];
      }

      // Add match stage
      pipeline.push({ $match: match });

      // Ensure missing fields treated as 0
      pipeline.push({
        $addFields: {
          totalOrderedQuantity: { $ifNull: ["$totalOrderedQuantity", 0] },
          totalOrders: { $ifNull: ["$totalOrders", 0] },
        },
      });

      // Compute score
      pipeline.push({
        $addFields: {
          score: {
            $add: [
              { $multiply: ["$totalOrderedQuantity", qtyWeight] },
              { $multiply: ["$totalOrders", ordersWeight] },
            ],
          },
        },
      });

      // Sort by score descending
      pipeline.push({
        $sort: { score: -1, totalOrderedQuantity: -1, totalOrders: -1 },
      });

      // Pagination
      if (skip > 0) pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      // Lookup variants (return only useful fields)
      pipeline.push({
        $lookup: {
          from: "productvariants",
          let: { variantIds: "$variants" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$variantIds"] } } },
            { $project: { size: 1, colorOption: 1, stock: 1, discountPrice: 1, originalPrice: 1, thumbnail: 1 } },
          ],
          as: "variants",
        },
      });

      // Lookup reviews stats efficiently
      pipeline.push({
        $lookup: {
          from: "reviews",
          let: { productId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$productId", "$$productId"] } } },
            { $group: { _id: null, avgRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
          ],
          as: "reviewsStats",
        },
      });

      pipeline.push({
        $addFields: {
          avgRating: { $arrayElemAt: ["$reviewsStats.avgRating", 0] },
          totalReviews: { $arrayElemAt: ["$reviewsStats.totalReviews", 0] },
        },
      });

      // Optional: include full reviews if needed
      pipeline.push({
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "productId",
          as: "reviews",
        },
      });

      // Project useful fields
      pipeline.push({
        $project: {
          name: 1,
          shopId: 1,
          images: 1,
          sku: 1,
          category: 1,
          totalOrderedQuantity: 1,
          totalOrders: 1,
          score: 1,
          createdAt: 1,
          variants: 1,
          reviews: 1,
          avgRating: 1,
          totalReviews: 1,
          badge: 1,
        },
      });

      const products = await Product.aggregate(pipeline).allowDiskUse(true);

      return res.status(200).json({
        success: true,
        count: products.length,
        products,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message || err, 500));
    }
  })
);

router.put(
  "/update-badge/:productId",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res) => {
    const product = await Product.findById(req.params.productId);
    if (!product) throw new ErrorHandler("Product not found", 404);

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.productId,
      { $set: { badge: !product.badge } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: `Badge ${updatedProduct.badge ? "enabled" : "disabled"} for product`,
      badge: updatedProduct.badge,
      productId: updatedProduct._id,
    });
  })
);



module.exports = router;


