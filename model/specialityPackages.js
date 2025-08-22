const mongoose = require("mongoose");

const specialityPackageTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
})

const specialityPackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  packageTypes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SpecialityPackageType",
    }
  ]
})

const SpecialityPackage = mongoose.model("SpecialityPackage", specialityPackageSchema)
const SpecialityPackageType = mongoose.model("SpecialityPackageType", specialityPackageTypeSchema)

module.exports = {
  SpecialityPackage,
  SpecialityPackageType
}
