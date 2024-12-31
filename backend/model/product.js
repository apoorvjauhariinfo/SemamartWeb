const mongoose = require("mongoose");
// const { productData } = require("../../frontend/src/static/data"); // wE DONT NEED STATIC DATA ANYMORE

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your product name!"],
  },
  hsn: {
    type: String,
    required: [true, "Please enter product HSN Code"],
  },
  productType: {
    type: String,
    require: [true, "Please enter your product type"],
  },
  originalPrice: {
    type: Number,
  },
  discountPrice: {
    type: Number,
    required: [true, "Please enter your product price!"],
  },
  category: {
    type: String,
    required: [true, "Please enter your product category!"],
  },
  tags: {
    type: String,
  },
  shortdescription: {
    type: String,
    required: [true, "Please enter your product short description!"],
  },
  description: {
    type: String,
    required: [true, "Please enter your product description!"],
  },
  stock: {
    type: Number,
    required: [true, "Please enter your product stock!"],
  },
  sku: {
    type: String,
  },
  stockStatus: {
    type: String,
  },
  enableStockManagement: {
    type: Boolean,
  },
  allowSingleQuantity: {
    type: Boolean,
  },
  taxStatus: {
    type: String,
  },
  taxClass: {
    type: String,
  },
  upsells: {
    type: String,
  },
  crosssells: {
    type: String,
  },
  discountOptions: {
    type: String,
  },
  rma: {
    type: String,
  },
  minmaxrule: {
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
  allowproductreviews: {
    type: Boolean,
  },
  weight: {
    type: String,
  },
  dimension: {
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

  thumbnail: {
    type: String, // Stores the main image URL or path
    // required: [true, "Please upload a thumbnail image!"],
  },

  images: [
    {
      type: String,
    },
  ],

  shortVideo: {
    type: String, // Stores the video URL or file path
    // required: [true, "Please upload a short video for the product!"],
  },

  reviews: [
    {
      user: {
        type: Object,
      },
      rating: {
        type: Number,
      },
      comment: {
        type: String,
      },
      productId: {
        type: String,
      },
      createdAt: {
        type: Date,
        default: Date.now(),
      },
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
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Product", productSchema);
