const mongoose = require("mongoose");

const UserCartSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  product_id: { type: String, required: true },
  variant_id: { type: String, required: false },
  qty: { type: Number, default: 1 },
}, { timestamps: true });

const UserCart = mongoose.model("UserCart", UserCartSchema);
module.exports = UserCart;
