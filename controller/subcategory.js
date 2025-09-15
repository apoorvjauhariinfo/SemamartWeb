const express = require("express")
const catchAsyncErrors = require("../middleware/catchAsyncErrors")

const Subcategory = require("../model/subcategory")
const ErrorHandler = require("../utils/ErrorHandler")

const router = express.Router()

router.get("/", catchAsyncErrors(
  async function (_, res) {
    const categories = await Subcategory.find().select("name category")
    res.json(categories)
  }
))

module.exports = router;
