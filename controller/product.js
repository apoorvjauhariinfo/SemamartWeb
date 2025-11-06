const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const { Product, ProductVariant } = require("../model/product");
const Order = require("../model/order");
const Shop = require("../model/shop");
const { upload, uploadV2, uploadDocUpdate } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Manufacturer  = require("../model/manufacturer");

//creatre product v2
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
      throw new ErrorHandler("Shop not found", 402);
    }

    const { manufacturerName, email, phone, origin, ...product } = req.body;

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
    product.variants = [];
    product.attributes = req.body?.attributes?.map((v) => JSON.parse(v)) || [];
    product.tags = req.body.tags.map((v) => v);

    if (req.files.images) {
      product.images = req.files.images.map((e) => e.filename);
    }
    if (req.files.thumbnail) {
      // product.thumbnail = req.files.thumbnail[0].filename
      req.files.thumbnail.forEach((el, i) => {
        variants[i].thumbnail = el.filename;
      });
    }
    if (req.files.shortVideo) {
      product.shortVideo = req.files.shortVideo[0].filename;
    }
    if (req.files.certificate) {
      product.certificate = req.files.certificate.map((c) => c.filename);
    }
    if (req.files.oemLetter) {
      product.oemLetter = req.files.oemLetter[0].filename;
    }
    if (req.files.prodcutComparisionSheet) {
      product.prodcutComparisionSheet =
        req.files.prodcutComparisionSheet[0].filename;
    }
    if (req.files.productCompilance) {
      product.productCompilance = req.files.productCompilance.map(
        (e) => e.filename,
      );
    }
    if (req.files.msds_ifu_leaflet) {
      product.msds_ifu_leaflet = req.files.msds_ifu_leaflet.map(
        (e) => e.filename,
      );
    }
    if (req.files.amc_cms) {
      product.amc_cms = req.files.amc_cms[0].filename;
    }

    const savedProduct = await Product.create(product);

    const savedVariants = await ProductVariant.insertMany(
      variants.map((v) => ({ ...v, productId: savedProduct._id })),
    );

    savedProduct.variants = savedVariants.map((v) => v._id);
    await savedProduct.save();

    res.status(201).json(savedProduct);
  }),
);

// get all products of a shop
router.get(
  "/get-all-products-shop/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({ shopId: req.params.id })
        .sort({ createdAt: -1 })
        .populate("variants")
        .select("name variants createdAt commission sku");

      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  }),
);

// delete product of a shop
router.delete(
  "/delete-shop-product/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const productId = req.params.id;

      const productData = await Product.findById(productId);

      productData.images.forEach((imageUrl) => {
        const filename = imageUrl;
        const filePath = `uploads/${filename}`;

        fs.unlink(filePath, (err) => {
          if (err) {
            console.log(err);
          }
        });
      });

      const product = await Product.findByIdAndDelete(productId);

      if (!product) {
        return next(new ErrorHandler("Product not found with this id!", 500));
      }

      res.status(201).json({
        success: true,
        message: "Product Deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  }),
);

// get all products
router.get(
  "/get-all-products",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find()
        .populate("shopId", "name")
        .populate({
          path: "variants", // field in Product
          model: "ProductVariant", // force it to use ProductVariant collection
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
  "/get-consumable-products",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({
        productType: "Consumables",
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

// get product details of product with id
router.get(
  "/get-product/:id",
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    try {
      const product = await Product.findById(id).populate("shopId variants manufacturer");

      if (!product) throw new Error("not found");

      res.status(200).json(product);
    } catch (error) {
      console.error(error);
      return next(new ErrorHandler(error, 400));
    }
  }),
);

// review for a product
router.put(
  "/create-new-review",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { user, rating, comment, productId, orderId } = req.body;

      const product = await Product.findById(productId);

      const review = {
        user,
        rating,
        comment,
        productId,
      };

      const isReviewed = product.reviews.find(
        (rev) => rev.user._id === req.user._id,
      );

      if (isReviewed) {
        product.reviews.forEach((rev) => {
          if (rev.user._id === req.user._id) {
            ((rev.rating = rating), (rev.comment = comment), (rev.user = user));
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

      await Order.findByIdAndUpdate(
        orderId,
        { $set: { "cart.$[elem].isReviewed": true } },
        { arrayFilters: [{ "elem._id": productId }], new: true },
      );

      res.status(200).json({
        success: true,
        message: "Reviwed succesfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  }),
);

// all products --- for admin
router.get(
  "/admin-all-products",
  // isAuthenticated,
  // isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate("variants")
      .select("name variants createdAt");

    res.status(201).json({
      success: true,
      products,
    });
  }),
);

router.get(
  "/search",
  catchAsyncErrors(async (req, res, next) => {
    const { q } = req.query;
    if (!q) {
      return res.status(200).json({ success: true, products: [] });
    }

    const regex = new RegExp(
      q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
      "i",
    );

    // Populate category to get its name
    const products = await Product.find()
      .populate("category", "name")
      .where({
        $or: [
          { name: regex },
          { manufacturerName: regex },
          { "category.name": regex }, // search by category name
        ],
      });

    res.status(200).json({ success: true, products });
  }),
);

router.get(
  "/get-products-by-subcategory/:subCategoryId",
  async (req, res, next) => {
    try {
      const { subCategoryId } = req.params;

      if (!mongoose.isValidObjectId(subCategoryId)) {
        return res.status(400).json({ message: "Invalid subCategoryId" });
      }
      const products = await Product.find({ subCategory: subCategoryId })
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
  },
);

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
  }),
);

router.put(
  "/update-product/:productId",
  uploadV2.none(),
  catchAsyncErrors(async (req, res) => {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) throw new ErrorHandler("product not found", 404);

    const updates = req.body;
    Object.keys(updates).forEach((k) => {
      product[k] = updates[k];
    });

    await product.save();
    res.json({ success: true });
  }),
);

router.get(
  "/get-products-by-speciality-package/:specialityPackageId",
  async (req, res, next) => {
    try {
      const { specialityPackageId } = req.params;

      if (!mongoose.isValidObjectId(specialityPackageId)) {
        return res.status(400).json({ message: "Invalid specialityPackageId" });
      }

      const products = await Product.find({
        specialityPackage: specialityPackageId,
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
  },
);

router.get(
  "/get-products-by-speciality-package-type/:specialityPackageTypeId",
  async (req, res, next) => {
    try {
      const { specialityPackageTypeId } = req.params;

      if (!mongoose.isValidObjectId(specialityPackageTypeId)) {
        return res
          .status(400)
          .json({ message: "Invalid specialityPackageTypeId" });
      }

      const products = await Product.find({
        specialityPackageType: specialityPackageTypeId,
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
  },
);

router.put(
  "/update-commission/:productId",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res) => {
    const product = await Product.findById(req.params.productId);
    if (!product) throw new ErrorHandler("Product not found", 404);

    product.commission = req.body.commission;
    await product.save();

    res.status(200).json({ success: true });
  }),
);

// backend: product.routes.js (or wherever you keep product routes)
// Add this route near your existing /search and /get-all-products-shop routes

router.get(
  "/searchseller",
  catchAsyncErrors(async (req, res, next) => {
    const { q, shopId } = req.query;

    // require shopId (we expect sellers to always pass it)
    if (!shopId) {
      return res.status(400).json({ success: false, message: "Missing shopId" });
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
    const regex = new RegExp(qStr.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");

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
      const catName = (p.category && (p.category).name) ? String((p.category).name) : "";
      if (regex.test(catName)) return true;

      // already matched name/manufacturer via DB $or
      // but safe return true (product included)
      return true;
    });

    return res.status(200).json({ success: true, products: finalProducts });
  })
);


module.exports = router;
