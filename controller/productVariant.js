const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { uploadV2 } = require("../multer");
const { isSeller } = require("../middleware/auth");
const { ProductVariant } = require("../model/product");
const path = require("path");
const fs = require("fs");

router.put(
  "/update-variant/:variantId",
  isSeller,
  uploadV2.single("thumbnail"),
  catchAsyncErrors(async (req, res) => {
    const { variantId } = req.params;
    const variant = await ProductVariant.findById(variantId).populate(
      "productId",
    );

    if (!variant) throw new ErrorHandler("Not found", 404);
    if (variant.productId.shopId.toString() !== req.seller._id.toString())
      throw new ErrorHandler("Not authorised", 401);

    if (req.file) {
      if (variant.thumbnail) {
        const imgPath = path.join(
          __dirname,
          "uploads/images",
          variant.thumbnail
        );
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }
      }
      variant.thumbnail = req.file.filename;
    }

    Object.keys(req.body).forEach(k=>{
        variant[k] = req.body[k]
    });
    
    await variant.save()
    res.json({success:true})
  })
);

module.exports = router;
