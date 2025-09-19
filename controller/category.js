const express = require("express");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

const Category = require("../model/category");
const Subcategory = require("../model/subcategory");
const ErrorHandler = require("../utils/ErrorHandler");

const router = express.Router();

// ✅ Get all categories
router.get("/", catchAsyncErrors(async (_req, res) => {
  const categories = await Category.find().populate("subcategories");
  res.json(categories);
}));

// ✅ Get category by ID
router.get("/:categoryId", catchAsyncErrors(async (req, res, next) => {
  const { categoryId } = req.params;
  const category = await Category.findById(categoryId).populate("subcategories");

  if (!category) return next(new ErrorHandler("Category not found", 404));
  res.json(category);
}));
// ✅ Get only category names (all)
router.get("/categoryName", catchAsyncErrors(async (_req, res, next) => {
  const categories = await Category.find({}, "name"); // only select the name field
  if (!categories || categories.length === 0) {
    return next(new ErrorHandler("No categories found", 404));
  }
  res.json({ success: true, categories });
}));

module.exports = router;
