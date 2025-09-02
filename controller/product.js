const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const Product = require("../model/product");
const Order = require("../model/order");
const Shop = require("../model/shop");
const { upload, uploadV2 } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const fs = require("fs");


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
    { name: "productCompilance", maxCount: 1 },
    { name: "msds_ifu_leaflet", maxCount: 1 },
    { name: "amc_cms", maxCount: 1 },
  ]),
  catchAsyncErrors(async (req, res, next) => {
    // const shopId = req.body.shopId;
    // const shop = await Shop.findById(shopId);
    //
    // if (!shop) {
    //   throw new ErrorHandler("Shop not found", 402)
    // }

    const product = req.body
    const variants = JSON.parse(product.variants)

    if (req.files.images) {
      product.images = req.files.images.map(e => e.filename)
    }
    if (req.files.thumbnail) {
      // product.thumbnail = req.files.thumbnail[0].filename
      req.files.thumbnail.forEach((el, i) => {
        variants[i].thumbnail = el.filename
      })
    }
    if (req.files.shortVideo) {
      product.shortVideo = req.files.shortVideo[0].filename
    }
    if (req.files.certificate) {
      product.certificate = req.files.certificate.map(c => c.filename)
    }
    if (req.files.oemLetter) {
      product.oemLetter = req.files.oemLetter[0].filename
    }
    if (req.files.prodcutComparisionSheet) {
      product.prodcutComparisionSheet = req.files.prodcutComparisionSheet[0].filename
    }
    if (req.files.productCompilace) {
      product.productCompilance = req.files.productCompilance[0].filename
    }
    if (req.files.msds_ifu_leaflet) {
      product.msds_ifu_leaflet = req.files.msds_ifu_leaflet[0].filename
    }
    if (req.files.amc_cms) {
      product.amc_cms = req.files.amc_cms[0].filename
    }

    product.variants = variants
    const pro = await new Product(product).save()
    res.status(201).json(pro)
  })
);

// get all products of a shop
router.get(
  "/get-all-products-shop/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({ shopId: req.params.id });

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
        .sort({ createdAt: -1 });

      res.status(201).json({
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
  "/get-pharmaceutical-products",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({
        productType: "Pharmaceutical",
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


// get product details of product with id
router.get(
  "/get-product/:id",
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    try {
      const product = await Product.findById(id).populate("shopId");

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
            (rev.rating = rating), (rev.comment = comment), (rev.user = user);
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
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
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
      "i"
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
  })
);


module.exports = router;
