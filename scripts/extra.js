const mongoose = require("mongoose");
const Shop = require("../model/shop");
const { Product } = require("../model/product");

// const url = "mongodb://127.0.0.1:27017/sema_local";
const url = "mongodb+srv://shubham:Qwertyuiop@cluster0.nbshs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function showShops() {
  await mongoose.connect(url);

  const products = await Product.find();
  const result = await Product.updateMany({}, { $set: { commission: 5 } });
}

showShops();
