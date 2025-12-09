const mongoose = require("mongoose");

const HeroItemSchema = new mongoose.Schema({
  name: String,
  link: String,
  imagePath: String,
});

const HeroSectionSchema = new mongoose.Schema(
  {
    leftBanner: HeroItemSchema,
    rightBanner: HeroItemSchema,
    sliders: [HeroItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("HeroSection", HeroSectionSchema);
