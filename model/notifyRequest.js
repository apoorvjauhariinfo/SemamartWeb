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
    },
    notified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);


notifyRequestSchema.post("save", async function (doc) {
  try {
    if (doc.notified) {
      await doc.deleteOne();
    }
  } catch (err) {
    console.error("Error deleting notify request after notification:", err);
  }
});


notifyRequestSchema.index(
  { user_id: 1, product_id: 1, variant_id: 1, shop_id: 1 },
  { unique: true }
);

module.exports = mongoose.model("NotifyRequest", notifyRequestSchema);
