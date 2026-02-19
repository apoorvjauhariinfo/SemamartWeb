// backend/controller/product.js
const express = require("express");
const { isSeller, isAuthenticated, isAdmin, hasPermission } = require("../middleware/auth");
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

router.post(
  "/create-product-v2",
  uploadV2.fields([
    { name: "images", maxCount: 5 },
    { name: "thumbnail" },
    { name: "shortVideo", maxCount: 1 },
    { name: "certificate", maxCount: 5 },
    { name: "oemLetter", maxCount: 1 },
    { name: "productComparisionSheet", maxCount: 1 },
    { name: "productCompilance", maxCount: 5 },
    { name: "msds_ifu_leaflet", maxCount: 5 },
    { name: "amc_cms", maxCount: 1 },
  ]),
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

    const variants = JSON.parse(product.variants);

    product.variants = []; // will be set after creating variant docs

    product.attributes = req.body?.attributes?.map((v) => JSON.parse(v)) || [];

    // tags: ensure array
    product.tags = Array.isArray(req.body.tags) ? req.body.tags : [];

    // files -> attach filenames where applicable (defensive checks)
    if (req.files && req.files.images) {
      product.images = req.files.images.map((e) => e.filename);
    }
    if (req.files && req.files.thumbnail) {
      // thumbnail may be an array; attach to variant thumbnails where appropriate
      req.files.thumbnail.forEach((el, i) => {
        variants[i].thumbnail = el.filename;
      });
    }
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
      variants.map((v) => ({ ...v, productId: savedProduct._id })),
    );

    savedProduct.variants = savedVariants.map((v) => v._id);

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
          "name variants createdAt commission sku visibilityByAdmin visibilityBySeller commissionHistory reviews"
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
          select:
            "thumbnail originalPrice discountPrice stock colorOption size",
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
          select: "thumbnail originalPrice discountPrice stock colorOption size",
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
          select:
            "thumbnail originalPrice discountPrice stock colorOption size",
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
      })
        .populate("shopId", "name")
        .populate({
          path: "manufacturer",
          select: "manufacturerName email phone origin",
        })
        .populate({
          path: "variants",
          model: "ProductVariant",
          select:
            "thumbnail originalPrice discountPrice stock colorOption size",
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
  hasPermission("StockManagement"),
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({
         visibilityByAdmin: true,
        visibilityBySeller: true,
      })
        .populate("shopId", "businessName")
        .populate({
          path: "variants",
          select:
            "thumbnail originalPrice discountPrice stock colorOption size",
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
  hasPermission("StockManagement"),
  isAuthenticated,
  catchAsyncErrors  (async (req, res, next) => {
    try {
      const products = await Product.find({
         visibilityByAdmin: true,
        visibilityBySeller: true,
      })
        .populate("shopId", "businessName")
        .populate({
          path: "variants",
          select:
            "thumbnail originalPrice discountPrice stock colorOption size",
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
            "thumbnail originalPrice discountPrice stock colorOption size bulkOrders",
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
      const product = await Product.findOne({
        _id: id,
        visibilityBySeller: true,
      }).populate("shopId variants manufacturer");

      if (!product) return next(new ErrorHandler("Product not found", 404));

      // Ensure attributes exist (defensive)
      product.attributes = product.attributes || [];
      product.brand = product.brand || null;

      // 2️⃣ Fetch reviews for this product
      const reviews = await Review.find({ _id: { $in: product.reviews } })
        .populate("user", "name") // optional: populate user info
        .select("rating comment images user")
        .lean();

      // 3️⃣ Calculate average rating
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      // Round to 1 decimal
      const roundedAvgRating = parseFloat(avgRating.toFixed(1));

      // 4️⃣ Send response
      res.status(200).json({
        ...product.toObject(),
        avgRating: roundedAvgRating,
        reviews,
      });
    } catch (error) {
      console.error(error);
      return next(new ErrorHandler(error.message || error, 400));
    }
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
        select: "thumbnail originalPrice discountPrice stock colorOption size",
      })
      .populate("shopId", "businessName")
      .populate("reviews", "rating") // 🔥 populate review ratings
      .select(
        "name variants createdAt commission sku visibilityByAdmin visibilityBySeller reviews"
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
        select: "thumbnail originalPrice discountPrice stock colorOption size",
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
      const products = await Product.find({ shopId: String(shopId) })
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
            "thumbnail originalPrice discountPrice stock colorOption size",
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
          "thumbnail originalPrice discountPrice stock colorOption size",
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
        specialityPackage: specialityPackageId,
        visibilityByAdmin: true,
        visibilityBySeller: true,
      })
        .select("name variants shopId reviews createdAt")
        .populate("shopId")
        .populate({
          path: "variants",
          select:
            "thumbnail originalPrice discountPrice stock colorOption size",
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
        specialityPackageType: specialityPackageTypeId,
        visibilityByAdmin: true,
        visibilityBySeller: true,
      })
        .select("name variants shopId reviews createdAt")
        .populate("shopId")
        .populate({
          path: "variants",
          select:
            "thumbnail originalPrice discountPrice stock colorOption size",
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
  uploadV2.none(),
  catchAsyncErrors(async (req, res) => {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) throw new ErrorHandler("product not found", 404);

    const updates = req.body || {};
    const metaData = {};
    Object.keys(updates).forEach((k) => {
      if (product[k] !== updates[k]) {
        if (k === "attributes") {
          updates[k] = updates[k].map((v) => JSON.parse(v));
        }
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
  "/update-commission/:productId",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res) => {
    const product = await Product.findById(req.params.productId).populate("shopId");
    if (!product) throw new ErrorHandler("Product not found", 404);
    if (!product.shopId) throw new ErrorHandler("Product shop not found", 404);
    if (!req.body.commission)
      throw new ErrorHandler("Commission is required", 403);

    const metaData = {
      commission: {
        oldValue: product.commission,
        newValue: req.body.commission,
      },
    };

    product.commission = req.body.commission;
    product.commissionHistory.push({
      commission: req.body.commission,
      updatedAt: new Date(),
    });

    await addActivityLog({
      userId: req.user._id,
      userType: "User",
      action: "Sema-Commission Update",
      entityType: "Product",
      entityId: product._id,
      description:
        "Admin updated the sema-commission for the product: " + product.name,
      metaData: metaData,
    });
    await product.save();

    const sellerMail = product.shopId.email
    const emailSubject="Prodcut Commission Update"
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
          <p><strong>Product Name:</strong> ${product.name}</p>
          <p><strong>Updated Commission:</strong> ${product.commission}%</p>
        </div>
        <p style="margin-top: 20px; font-size: 14px;">
          This update will apply to all future orders of this product.
        </p>
      </div>
    `;

    await sendMail({email:sellerMail,subject:emailSubject,html:htmlBody })

    res.status(200).json({ success: true });
  }),
);

router.get("/get-products-by-category/:CategoryId", async (req, res, next) => {
  try {
    const { CategoryId } = req.params;

    if (!mongoose.isValidObjectId(CategoryId)) {
      return res.status(400).json({ message: "Invalid CategoryId" });
    }
    const products = await Product.find({ category: CategoryId })
      .populate("shopId")
      .populate({
        path: "variants",
        select: "thumbnail originalPrice discountPrice stock colorOption size",
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
      const products = await Product.find({ shopId: String(shopId) })
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

      // Build a single match object for optional filters (shopId, category)
      const match = {};

      if (shopId) {
        if (!mongoose.isValidObjectId(String(shopId))) {
          return next(new ErrorHandler("Invalid shopId", 400));
        }
        match.shopId = new mongoose.Types.ObjectId(String(shopId));
      }

      if (categoryParam) {
        // categoryParam may be comma-separated list
        const raw = String(categoryParam);
        const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);

        // convert to ObjectId array (validate)
        const catIds = [];
        for (const p of parts) {
          if (!mongoose.isValidObjectId(p)) {
            return next(new ErrorHandler(`Invalid category id: ${p}`, 400));
          }
          catIds.push(new mongoose.Types.ObjectId(p));
        }

        if (catIds.length === 1) {
          // match if category array contains this id
          match.category = catIds[0];
        } else if (catIds.length > 1) {
          // match if category array contains any of the ids
          match.category = { $in: catIds };
        }
      }

      if (Object.keys(match).length > 0) {
        pipeline.push({ $match: match });
      }

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

      // sort by score desc
      pipeline.push({
        $sort: {
          score: -1,
          totalOrderedQuantity: -1,
          totalOrders: -1,
        },
      });

      // pagination
      if (skip > 0) pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      // Populate variants array (keep it as an array)
      pipeline.push({
        $lookup: {
          from: "productvariants",
          localField: "variants",
          foreignField: "_id",
          as: "variants",
        },
      });
      // After your variants lookup
      pipeline.push({
        $lookup: {
          from: "reviews",           // reviews collection
          localField: "_id",         // product _id
          foreignField: "productId", // review.productId
          as: "reviewsDetails",      // array of full reviews
        },
      });

      pipeline.push({
        $addFields: {
          avgRating: {
            $cond: [
              { $gt: [{ $size: "$reviewsDetails" }, 0] }, // if reviews exist
              { $avg: "$reviewsDetails.rating" },        // compute avg
              null                                      // else null
            ]
          }
        }
      });



      // Return useful fields and keep the full variants array (not single variant)
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
          reviews: "$reviewsDetails",
          avgRating: 1,
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




module.exports = router;
