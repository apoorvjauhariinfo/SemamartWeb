const express = require("express")
const mongoose = require("mongoose");
const catchAsyncErrors = require("../middleware/catchAsyncErrors")

const Category = require("../model/category")
const Subcategory = require("../model/subcategory")
const ErrorHandler = require("../utils/ErrorHandler")

const router = express.Router()

router.get("/", catchAsyncErrors(
  async function (_req, res) {
    const categories = await Category.find()
    res.json(categories)
  }
))


router.get("/categoryName", catchAsyncErrors(
  async function (_req, res) {
    const categories = await Category.find().select('name _id');
    res.json(categories);
  }
));


router.get("/:categoryId", catchAsyncErrors(
  async (req, res) => {
    const { categoryId } = req.params
    const category = await Category.findById(categoryId).populate("subcategories")
    if (!category) throw new ErrorHandler("Not found", 404)
    res.json(category)
  }
))

router.get("/:categoryId/subcategories", catchAsyncErrors(
  async (req, res, next) => {
    const { categoryId } = req.params;

    const subcategories = await Subcategory.find({ category: categoryId });

    if (!subcategories) {
      return next(new ErrorHandler("Subcategories not found", 404));
    }

    res.json(subcategories);
  }
));

module.exports = router;

