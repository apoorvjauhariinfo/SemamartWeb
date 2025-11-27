// backend/controller/product.js
const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
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

/**
 * Helper: parse attributes that might come as:
 * - undefined
 * - a single JSON string
 * - an array of JSON strings
 *
 * Returns array of parsed objects (skips invalid JSON).
 */
function parseAttributesFromReqBody(bodyOrRaw) {
  // Accept either the full req.body or just req.body.attributes (to be flexible)
  const raw = bodyOrRaw?.attributes !== undefined ? bodyOrRaw.attributes : bodyOrRaw;
  if (!raw) return [];
  try {
    if (Array.isArray(raw)) {
      return raw
        .map((s) => {
          try {
            if (typeof s === "string") return JSON.parse(s);
            return s;
          } catch {
            // If parsing failed, try to treat "key:value" style used accidentally
            if (typeof s === "string" && s.includes(":")) {
              const [k, ...rest] = s.split(":");
              return { [k.trim()]: rest.join(":").trim() };
            }
            return null;
          }
        })
        .filter(Boolean);
    } else if (typeof raw === "string") {
      try {
        return [JSON.parse(raw)];
      } catch {
        if (raw.includes(":")) {
          const [k, ...rest] = raw.split(":");
          return [{ [k.trim()]: rest.join(":").trim() }];
        }
        // fallback: wrap as value
        return [{ value: raw }];
      }
    } else if (typeof raw === "object") {
      return [raw];
    } else {
      return [];
    }
  } catch (err) {
    return [];
  }
}

/* ------------------ CREATE PRODUCT (seller) ------------------ */
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

    // Ensure variants parsed correctly (variants sent as JSON string)
    const variants = (() => {
      try {
        return JSON.parse(product.variants || "[]");
      } catch (e) {
        return [];
      }
    })();
    product.variants = []; // will be set after creating variant docs

    // ---------- Robustly parse attributes ----------
    product.attributes = parseAttributesFromReqBody(req.body); // now always an array

    // tags: ensure array
    product.tags = Array.isArray(req.body.tags) ? req.body.tags : [];

    // files -> attach filenames where applicable (defensive checks)
    if (req.files && req.files.images) {
      product.images = req.files.images.map((e) => e.filename);
    }
    if (req.files && req.files.thumbnail) {
      // thumbnail may be an array; attach to variant thumbnails where appropriate
      req.files.thumbnail.forEach((el, i) => {
        if (variants[i]) variants[i].thumbnail = el.filename;
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
        (e) => e.filename
      );
    }
    if (req.files && req.files.msds_ifu_leaflet) {
      product.msds_ifu_leaflet = req.files.msds_ifu_leaflet.map(
        (e) => e.filename
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

    // Create product variants (if any)
    let savedVariants = [];
    if (Array.isArray(variants) && variants.length > 0) {
      savedVariants = await ProductVariant.insertMany(
        variants.map((v) => ({ ...v, productId: savedProduct._id }))
      );
      savedProduct.variants = savedVariants.map((v) => v._id);
    }

    // initial commission history
    savedProduct.commissionHistory = [
      {
        commission: savedProduct.commission,
        updatedAt: new Date(),
      },
    ];

    await savedProduct.save();

    // add activity log (best-effort)
    try {
      await addActivityLog({
        userId: shopId,
        userType: "Shop",
        action: "Product Added",
        entityType: "Product",
        entityId: savedProduct._id,
        description:
          shop.businessName + " added the product " + savedProduct.name,
      });
    } catch (err) {
      // don't crash product creation if logging fails
      console.warn("Activity log error:", err.message || err);
    }

    res.status(201).json(savedProduct);
  })
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
        .select("name variants createdAt commission sku visibilityByAdmin visibilityBySeller");

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
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
  })
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
      })
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message || error, 400));
    }
  })
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
  })
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
  })
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
      const product = await Product.findOne({
        _id: id,
        visibilityByAdmin: true,
        visibilityBySeller: true,
      }).populate("shopId variants manufacturer");

      if (!product) return next(new ErrorHandler("Product not found", 404));

      // ensure attributes exists (defensive): model pre-save covers it, but for read we normalise
      product.attributes = product.attributes || [];
      product.brand = product.brand || null;

      res.status(200).json(product);
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
        (rev) => String(rev.user._id) === String(req.user._id)
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
          { arrayFilters: [{ "elem._id": productId }], new: true }
        );
      }

      res.status(200).json({
        success: true,
        message: "Reviewed successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message || error, 400));
    }
  })
);

/* ------------------ ADMIN: admin-all-products (for admin portal) ------------------ */
router.get(
  "/admin-all-products",
  // keep auth commented if you want public access for admin UI devs; uncomment in prod
  // isAuthenticated,
  // isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find()
        .sort({ createdAt: -1 })
        .populate({
          path: "variants",
          model: "ProductVariant",
          select: "thumbnail originalPrice discountPrice stock colorOption size",
        })
        .select("name variants createdAt commission sku visibilityByAdmin visibilityBySeller");

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message || error, 500));
    }
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
    const regex = new RegExp(term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");

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
        if (p.category.some((c) => c && regex.test(String(c.name || "")))) return true;
      } else if (p.category && p.category.name && regex.test(String(p.category.name))) return true;
      return false;
    });

    return res.status(200).json({ success: true, products: finalProducts });
  })
);

/* ------------------ SELLER SEARCH (seller portal) ------------------ */
router.get(
  "/searchseller",
  catchAsyncErrors(async (req, res, next) => {
    const { q, shopId } = req.query;

    if (!shopId) {
      return res.status(400).json({ success: false, message: "Missing shopId" });
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
    const regex = new RegExp(qStr.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");

    const products = await Product.find({
      shopId: String(shopId),
      $or: [{ name: regex }, { manufacturerName: regex }],
    })
      .populate("variants")
      .populate("category", "name")
      .lean();

    // final in-memory filter covering category.name
    const finalProducts = products.filter((p) => {
      const catName = p.category && p.category.name ? String(p.category.name) : "";
      if (regex.test(catName)) return true;
      return true; // keep product if already matched name/manufacturer
    });

    return res.status(200).json({ success: true, products: finalProducts });
  })
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
      const products = await Product.find({
        subCategory: subCategoryId,
        visibilityByAdmin: true,
        visibilityBySeller: true,
      })
        .populate("shopId")
        .populate({
          path: "variants",
          select:
            "thumbnail originalPrice discountPrice stock colorOption size",
        })
        .lean();

      if (!products || products.length === 0) {
        return res.status(200).json([]);
      }

      res.status(200).json(products);
    } catch (error) {
      next(error);
    }
  })
);

/* ------------------ PUBLIC: get-products-by-category (user) ------------------ */
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
        .populate("shopId")
        .populate({
          path: "variants",
          select:
            "thumbnail originalPrice discountPrice stock colorOption size",
        })
        .lean();

      res.status(200).json(products);
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
        .populate("shopId")
        .populate({
          path: "variants",
          select:
            "thumbnail originalPrice discountPrice stock colorOption size",
        })
        .lean();

      res.status(200).json(products);
    } catch (error) {
      next(error);
    }
  })
);

/* ------------------ UPLOAD / UPDATE helpers (admin/seller) ------------------ */
router.put(
  "/upload-doc/:productId",
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
    // Delete old file if exists
    const oldFile =
      idx !== undefined ? product[docType][parseInt(idx)] : product[docType];
    if (oldFile) {
      const oldPath = path.join("uploads/docs", oldFile);
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

    await product.save();

    res.status(200).json({
      success: true,
      message: "Document replaced successfully",
      product,
    });
  })
);

router.put(
  "/upload-image/:productId",
  uploadV2.single("images"),
  catchAsyncErrors(async (req, res) => {
    const { productId } = req.params;
    const { idx } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const oldFile = idx !== undefined ? product.images[parseInt(idx)] : null;
    if (oldFile) {
      const oldPath = path.join("uploads/images", oldFile);
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

    res.json({ success: true, product });
  })
);

/* ------------------ UPDATE PRODUCT (admin/seller) ------------------ */
router.put(
  "/update-product/:productId",
  uploadV2.none(),
  catchAsyncErrors(async (req, res) => {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) throw new ErrorHandler("product not found", 404);

    const updates = req.body || {};

    // If attributes are present in form-data, parse them correctly
    if (updates.hasOwnProperty("attributes")) {
      // updates may be string/array/object; parse into array of objects
      updates.attributes = parseAttributesFromReqBody(updates);
    }

    // If brand is being provided in update, enforce non-empty & trim
    if (updates.hasOwnProperty("brand")) {
      if (!updates.brand || String(updates.brand).trim() === "") {
        throw new ErrorHandler("Brand is required", 400);
      }
      updates.brand = String(updates.brand).trim();
    }

    // Apply updates (small whitelist would be safer, but keeping current approach)
    Object.keys(updates).forEach((k) => {
      // for certain keys you might need type coercion; leaving assignment as-is
      product[k] = updates[k];
    });

    await product.save();
    res.json({ success: true });
  })
);

/* ------------------ COMMISSION (admin) ------------------ */
router.put(
  "/update-commission/:productId",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res) => {
    const product = await Product.findById(req.params.productId);
    if (!product) throw new ErrorHandler("Product not found", 404);

    product.commission = req.body.commission;
    product.commissionHistory.push({
      commission: req.body.commission,
      updatedAt: new Date(),
    });

    await product.save();

    res.status(200).json({ success: true });
  })
);

/* ------------------ SELLER-VISIBILITY (seller toggles their products) ------------------ */
router.put(
  "/seller-visibility",
  isAuthenticated,
  isSeller,
  catchAsyncErrors(async (req, res) => {
    try {
      let { productIds, proIds, productId, isVisible } = req.body;

      if (typeof isVisible === "string") isVisible = isVisible === "true";

      let ids = [];
      if (Array.isArray(productIds) && productIds.length) ids = productIds;
      else if (Array.isArray(proIds) && proIds.length) ids = proIds;
      else if (productId) ids = [productId];
      else {
        return res.status(400).json({ success: false, message: "Missing productIds" });
      }

      ids = ids.map((id) => String(id)).filter(Boolean);
      if (ids.length === 0) {
        return res.status(400).json({ success: false, message: "No valid productIds provided" });
      }

      // OPTIONAL: enforce that seller can only change their own products
      // Uncomment to enable ownership check
      /*
      const ownedCount = await Product.countDocuments({ _id: { $in: ids }, shopId: req.seller._id });
      if (ownedCount !== ids.length) {
        return res.status(403).json({ success: false, message: "You can only update your own products" });
      }
      */

      const result = await Product.updateMany(
        { _id: { $in: ids } },
        { $set: { visibilityBySeller: Boolean(isVisible) } }
      );

      const modified =
        (typeof result.modifiedCount === "number" && result.modifiedCount) ||
        (typeof result.nModified === "number" && result.nModified) ||
        0;

      try {
        await addActivityLog({
          userId: req.seller._id,
          userType: "Shop",
          action: "Vendor Update",
          entityType: "Product",
          entityId: ids.length === 1 ? ids[0] : null,
          description: `${req.seller.businessName} set seller-visibility=${isVisible} for ${ids.length} product(s)`,
          metaData: { productIds: ids, visibilityBySeller: isVisible },
        });
      } catch (logErr) {
        console.warn("Activity log failed:", logErr.message || logErr);
      }

      return res.status(200).json({
        success: true,
        message: `Updated ${modified} product(s)`,
        modifiedCount: modified,
      });
    } catch (err) {
      console.error("seller-visibility error:", err);
      return res.status(500).json({ success: false, message: err.message || "Server error" });
    }
  })
);

/* ------------------ ADMIN-VISIBILITY (admin toggles) ------------------ */
router.put(
  "/admin-visibility",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    const { productIds, isVisible } = req.body;

    if (!Array.isArray(productIds) || typeof isVisible !== "boolean") {
      return res.status(400).json({ success: false, message: "Invalid request body: productIds (array) and isVisible (boolean) required" });
    }

    const validIds = productIds.filter((id) => mongoose.isValidObjectId(id));
    await Product.updateMany(
      { _id: { $in: validIds } },
      { $set: { visibilityByAdmin: isVisible } }
    );

    res.json({ success: true, productIds: validIds, visibilityByAdmin: isVisible });
  })
);

module.exports = router;
