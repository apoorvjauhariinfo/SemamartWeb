const mongoose = require("mongoose");

const notifyRequestSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      default: null,
    },
    shop_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /\S+@\S+\.\S+/.test(v);
        },
        message: props => `${props.value} is not a valid email!`,
      },
    },
    notified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Partial index: uniqueness only for unnotified requests
notifyRequestSchema.index(
  { user_id: 1, product_id: 1, variant_id: 1, email: 1, shop_id: 1 },
  { unique: true, partialFilterExpression: { notified: false } }
);

module.exports = mongoose.model("NotifyRequest", notifyRequestSchema);
