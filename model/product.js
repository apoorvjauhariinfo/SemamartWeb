const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your product name!"],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "Please enter your product category"],
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subcategory",
    required: [true, "Please enter your product subcategory"],
  },
  tags: [{
    type: String,
    required: true,
  }],
  productType: {
    type: String,
    required: true,
  },
  intendedUse: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    required: true
  },
  gtin: {
    type: String,
    required: true
  },
  hsn: {
    type: String,
    required: true
  },
  unspsc: {
    type: String,
  },
  upsells: {
    type: String,
  },
  crosssells: {
    type: String,
  },
  manufacturerName: {
    type: String,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  origin: {
    type: String,
  },

  /////
  shortdescription: {
    type: String,
    required: [true, "Please enter your product short description!"],
  },
  description: {
    type: String,
    required: [true, "Please enter your product description!"],
  },
  attributes: [{
    type: mongoose.Schema.Types.Mixed
  }],
  weight: {
    type: String,
    required: true
  },
  dimension: {
    type: String,
    required: true
  },
  colorOptions: {
    type: String, // TODO:
  },
  sterile: {
    type: Boolean,
    required: true
  },
  singelUse: {
    type: Boolean,
    required: true
  },
  expiry: {
    type: Date,
  },
  productCompilance: {
    type: String // document name
  },
  msds_ifu_leaflet: {
    type: String // document name
  },

  /////
  originalPrice: {
    type: Number,
    required: [true, "Please enter your product mrp!"],
  },
  discountPrice: {
    type: Number,
  },
  institutePrice: {
    type: Number,
  },
  minmaxrule: {
    type: mongoose.Schema.Types.Mixed
  },
  taxStatus: {
    type: String,
  },
  taxClass: {
    type: Number,
  },
  stock: {
    type: Number,
    required: [true, "Please enter your product stock!"],
  },
  unitOfMeasure: {
    type: String,
    required: true
  },
  stockStatus: {
    type: String,
  },
  deliveryLeadTime: {
    type: String
  },
  warranty: {
    type: String // TODO:
  },
  enableStockManagement: {
    type: Boolean,
  },
  amc_cms: {
    type: String // if present then document name
  },
  rma: {
    type: String,
  },

  //////
  dispatchLocation: {
    type: String,
    required: true
  },
  dispatchPinCode: {
    type: Number,
    required: true
  },
  unitsPerCarton: {
    type: Number,
    required: true
  },
  shippingWeight: {
    type: Number, // in kgs
    required: true
  },
  packagingType: {
    type: String,
    required: true
  },
  deliveryPartner: {
    type: String,
  },
  shelfing_storage_req: {
    type: String,
  },

  ///////
  allowSingleQuantity: {
    type: Boolean,
  },
  discountOptions: {
    type: String,
  },
  productStatus: {
    type: String,
  },
  visibility: {
    type: String,
  },
  purchaseNote: {
    type: String,
  },

  /////
  thumbnail: {
    type: String, // Stores the image name we have saved
  },
  images: [{
    type: String, // image name
  }],
  shortVideo: {
    type: String, // Stores the video URL or file path
  },
  certificate: {
    type: String, // certi name
  },
  oemLetter: {
    type: String, // letter doc name
  },
  productComparisionSheet: {
    type: String, // sheet pdf name
  },

  /////
  allowproductreviews: {
    type: Boolean,
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Review"
  }],
  ratings: {
    type: Number,
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
  },
  sold_out: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true
});

module.exports = mongoose.model("Product", productSchema);
