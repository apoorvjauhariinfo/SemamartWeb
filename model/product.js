const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  size: { type: String, required: false, default: null },
  colorOption: { type: String, required: false, default: null },
  thumbnail: { type: String, default: null },
  originalPrice: {
    type: Number,
    required: [true, "Please enter your product mrp!"],
  },
  discountPrice: {
    type: Number,
  },
  stock: {
    type: Number,
    required: [true, "Please enter your product stock!"],
  },
  bulkOrders: [
    {
      qty: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your product name!"],
    },
    category: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: [true, "Please enter your product category"],
      },
    ],
    subCategory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subcategory",
        required: [true, "Please enter your product subcategory"],
      },
    ],
    tags: [
      {
        type: String,
        required: true,
      },
    ],
    productType: {
      type: String,
      required: true,
    },
    intendedUse: {
      type: String,
    },
    sku: {
      type: String,
      required: true,
    },
    gtin: {
      type: String,
      required: true,
    },
    hsn: {
      type: String,
      required: true,
    },
    unspsc: {
      type: String,
    },
    upsells: {
      type: [String],
      defaule: [],
    },
    crosssells: {
      type: [String],
      default: [],
    },
    specialityPackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SpecialityPackage",
      required: true,
    },
    specialityPackageType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SpecialityPackageType",
      required: true,
    },
    //////
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
    manufacturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manufacturer",
      //required: true,
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
    attributes: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],
    weight: {
      type: String,
      required: true,
    },
    dimension: {
      type: String,
      required: true,
    },
    variants: [{ type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant" }],
    sterile: {
      type: Boolean,
      // required: true
    },
    singleUse: {
      type: Boolean,
      // required: true
    },
    manufacturingDate: {
      type: Date,
    },
    productCompilance: [
      {
        type: String, // document name
      },
    ],
    msds_ifu_leaflet: [
      {
        type: String, // document name
      },
    ],
    minmaxrule: {
      type: mongoose.Schema.Types.Mixed,
    },
    taxStatus: {
      type: String,
    },
    taxClass: {
      type: Number,
      default:0
    },
    unitOfMeasure: {
      type: String,
      // required: true,
    },
    stockStatus: {
      type: String,
    },
    deliveryLeadTime: {
      type: String, // TODO: make it a number ?
    },
    warranty: {
      type: String, // TODO:
    },
    enableStockManagement: {
      type: Boolean,
    },
    amc_cms: {
      type: String, // if present then document name
    },
    rma: {
      type: String,
    },

    //////
    dispatchLocation: {
      type: String,
      required: true,
    },
    dispatchPinCode: {
      type: Number,
      required: true,
    },
    unitsPerCarton: {
      type: Number,
      required: true,
    },
    shippingWeight: {
      type: Number, // in kgs
      required: true,
    },
    packagingType: {
      type: String,
      required: true,
    },
    deliveryPartner: {
      type: String,
      default: null,
    },
    deliveryInstruction: {
      type: String,
      default: null,
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
      default: "public", // TODO: make it boolean and change it on adminn verification
    },
    purchaseNote: {
      type: String,
    },
    images: [
      {
        type: String, // image name
      },
    ],
    shortVideo: {
      type: String, // Stores the video URL or file path
    },
    certificate: [
      {
        type: String, // certi name
      },
    ],
    oemLetter: {
      type: String, // letter doc name
    },
    productComparisionSheet: {
      type: String, // sheet pdf name
    },

    /////
    allowProductReviews: {
      type: Boolean,
      default: true,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
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
    commission: {
      type: Number,
      default: 5,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Product = mongoose.model("Product", productSchema);
const ProductVariant = mongoose.model("ProductVariant", variantSchema);

module.exports = {
  Product,
  ProductVariant,
};
