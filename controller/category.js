const express = require("express")
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

router.get("/:categoryId", catchAsyncErrors(
  async (req, res) => {
    const { categoryId } = req.params
    const category = await Category.findById(categoryId).populate("subcategories")
    if (!category) throw new ErrorHandler("Not found", 404)
    res.json(category)
  }
))

module.exports = router;

