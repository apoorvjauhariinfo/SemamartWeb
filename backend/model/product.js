const mongoose = require("mongoose");
// const { productData } = require("../../frontend/src/static/data"); // wE DONT NEED STATIC DATA ANYMORE

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your product name!"],
  },
  productType: {
    type:String,
    require:[true, "Please enter your product type"],
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
    type: String,
  },
  allowSingleQuantity: {
    type: String,
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
    type: String,
  },

 
  
 
  images: [
    {
      type: String,
    },
  ],

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
    type: String,
    required: true,
  },
  shop: {
    type: Object,
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
