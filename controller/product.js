const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const { Product, ProductVariant } = require("../model/product"); // ✅ Correct import
const Order = require("../model/order");
const Shop = require("../model/shop");
const { upload } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const fs = require("fs");

// ✅ Create product
router.post(
  "/create-product",
  upload.fields([
    { name: "images" }, // multiple images
    { name: "thumbnail" }, // single thumbnail
    { name: "shortVideo" }, // single video
  ]),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shopId = req.body.shopId;
      const shop = await Shop.findById(shopId);

      if (!shop) return next(new ErrorHandler("Shop Id is invalid!", 400));

      const files = req.files;

      const imageUrls = files["images"]
        ? files["images"].map((file) => file.filename)
        : [];
      const thumbnailUrl = files["thumbnail"]
        ? files["thumbnail"][0].filename
        : null;
      const shortVideoUrl = files["shortVideo"]
        ? files["shortVideo"][0].filename
        : null;

      const productData = {
        ...req.body,
        images: imageUrls,
        thumbnail: thumbnailUrl,
        shortVideo: shortVideoUrl,
      };

      const product = await Product.create(productData);

      res.status(201).json({ success: true, product });
    } catch (error) {
      return next(new ErrorHandler(error.message || "Internal Server Error", 500));
    }
  })
);

// ✅ Get all products of a shop
router.get(
  "/get-all-products-shop/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({ shopId: req.params.id });
      res.status(200).json({ success: true, products });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// ✅ Delete product of a shop
router.delete(
  "/delete-shop-product/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const productId = req.params.id;
      const productData = await Product.findById(productId);

      if (!productData)
        return next(new ErrorHandler("Product not found with this id!", 404));

      // delete images
      productData.images.forEach((imageUrl) => {
        const filePath = `uploads/${imageUrl}`;
        fs.unlink(filePath, (err) => {
          if (err) console.log(err);
        });
      });

      await Product.findByIdAndDelete(productId);

      res.status(200).json({ success: true, message: "Product deleted successfully!" });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// ✅ Get all products (with first variant only)
router.get(
  "/get-all-products",
  catchAsyncErrors(async (_req, res, next) => {
    try {
      const products = await Product.find()
        .populate("shopId", "name")
        .populate({
          path: "variants",
          options: { sort: { createdAt: 1 } },
          perDocumentLimit: 1, // only first variant
        })
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, products });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// ✅ Get consumables
router.get(
  "/get-consumable-products",
  catchAsyncErrors(async (_req, res, next) => {
    try {
      const products = await Product.find({ productType: "Consumables" }).sort({ createdAt: -1 });
      res.status(200).json({ success: true, products });
    } catch (error) {
      return next(new ErrorHandler(error.message || error, 400));
    }
  })
);

// ✅ Get equipment
router.get(
  "/get-equipment-products",
  catchAsyncErrors(async (_req, res, next) => {
    try {
      const products = await Product.find({ productType: "Equipment" }).sort({ createdAt: -1 });
      res.status(200).json({ success: true, products });
    } catch (error) {
      return next(new ErrorHandler(error.message || error, 400));
    }
  })
);

// ✅ Get pharmaceuticals
router.get(
  "/get-pharmaceutical-products",
  catchAsyncErrors(async (_req, res, next) => {
    try {
      const products = await Product.find({ productType: "Pharmaceutical" }).sort({ createdAt: -1 });
      res.status(200).json({ success: true, products });
    } catch (error) {
      return next(new ErrorHandler(error.message || error, 400));
    }
  })
);

// ✅ Get single product
router.get(
  "/get-product/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.id)
        .populate("shopId", "name")
        .populate({
          path: "variants",
          select: "size colorOption thumbnail originalPrice discountPrice stock",
          options: { sort: { createdAt: 1 } },
        });

      if (!product) throw new Error("Product not found");

      const defaultVariant = product.variants.length > 0 ? product.variants[0] : null;

      res.status(200).json({ success: true, product, defaultVariant });
    } catch (error) {
      console.error(error);
      return next(new ErrorHandler(error, 400));
    }
  }),
);


router.get('/get-products-by-subcategory/:subCategoryId', async (req, res, next) => {
  try {
    const { subCategoryId } = req.params;

    if (!mongoose.isValidObjectId(subCategoryId)) {
      return res.status(400).json({ message: 'Invalid subCategoryId' });
    }
   const products = await Product.find({ subCategory: subCategoryId })
      .populate('shopId',) 
      .populate({
        path: 'variants',
        select: 'thumbnail originalPrice discountPrice stock colorOption size', 
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



// review for a product
router.put(
  "/create-new-review",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { user, rating, comment, productId, orderId } = req.body;

      const product = await Product.findById(productId);
      if (!product) return next(new ErrorHandler("Product not found", 404));

      const review = { user, rating, comment, productId };

      const isReviewed = product.reviews.find((rev) => rev.user._id === req.user._id);

      if (isReviewed) {
        product.reviews.forEach((rev) => {
          if (rev.user._id === req.user._id) {
            rev.rating = rating;
            rev.comment = comment;
            rev.user = user;
          }
        });
      } else {
        product.reviews.push(review);
      }

      product.ratings =
        product.reviews.reduce((acc, rev) => acc + rev.rating, 0) /
        product.reviews.length;

      await product.save({ validateBeforeSave: false });

      await Order.findByIdAndUpdate(
        orderId,
        { $set: { "cart.$[elem].isReviewed": true } },
        { arrayFilters: [{ "elem._id": productId }], new: true }
      );

      res.status(200).json({ success: true, message: "Reviewed successfully!" });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// ✅ Admin: get all products
router.get(
  "/admin-all-products",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (_req, res, next) => {
    try {
      const products = await Product.find().sort({ createdAt: -1 });
      res.status(200).json({ success: true, products });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
