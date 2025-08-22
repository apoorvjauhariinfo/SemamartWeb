const express = require("express")
const catchAsyncErrors = require("../middleware/catchAsyncErrors")
const { SpecialityPackage } = require("../model/specialityPackages")

const router = express.Router()

router.get("/", catchAsyncErrors(
  async (req, res) => {
    const a = await SpecialityPackage.find().select("-packageTypes")
    res.json(a)
  }
))

router.get("/:id", catchAsyncErrors(
  async (req, res) => {
    const { id } = req.params
    const a = await SpecialityPackage.findById(id).populate("packageTypes")
    res.json(a)
  }
))


module.exports = router
