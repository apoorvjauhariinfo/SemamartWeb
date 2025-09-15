const mongoose = require("mongoose");
const Shop = require("../model/shop");
const Product = require("../model/product");

const url = "mongodb://127.0.0.1:27017/sema_local"

async function showShops() {
  await mongoose.connect(url);

  await Product.findByIdAndUpdate('68c4010762d012bd94e899fa', {
    certificate: ["it-1757675783107-573432320.pdf", "it-1757675783107-573432320.pdf"],
    amc_cms: "it-1757675783107-573432320.pdf",
    oemLetter: "it-1757675783107-573432320.pdf",
    productComparisionSheet: "it-1757675783107-573432320.pdf",
    msds_ifu_leaflet: "it-1757675783107-573432320.pdf",
    productCompilance: "it-1757675783107-573432320.pdf"
  })
}

showShops()
