const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { uploadV2 } = require("../multer");
const { isSeller } = require("../middleware/auth");
const { ProductVariant, Product } = require("../model/product");
const path = require("path");
const fs = require("fs");

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

      product.variants.push(variant)
      await product.save()
      res.status(201).json({success:true});
      return;
    }
    throw new ErrorHandler();
  })
);

router.put(
  "/update-variant/:variantId",
  isSeller,
  uploadV2.single("thumbnail"),
  catchAsyncErrors(async (req, res) => {
    const { variantId } = req.params;
    const variant = await ProductVariant.findById(variantId).populate(
      "productId"
    );

    if (!variant) throw new ErrorHandler("Not found", 404);
    if (variant.productId.shopId.toString() !== req.seller._id.toString())
      throw new ErrorHandler("Not authorised", 401);

    if (req.file) {
      if (variant.thumbnail) {
        const imgPath = path.join(
          process.cwd(),
          "uploads","images",
          variant.thumbnail
        );
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }
      }
      variant.thumbnail = req.file.filename;
    }

    req.body.bulkOrders = JSON.parse(req.body.bulkOrders)

    Object.keys(req.body).forEach((k) => {
      variant[k] = req.body[k];
    });

    await variant.save();
    res.json({ success: true });
  })
);

module.exports = router;
