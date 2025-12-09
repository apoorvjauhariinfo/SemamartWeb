const mongoose = require("mongoose");

const BannerItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  link: { type: String, required: true },
  image: { type: String, required: true }, // stored image path
});

const SectionSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Section Banner 1/2/3
  left: { type: BannerItemSchema, required: true },
  right: { type: BannerItemSchema, required: true },
});

const SectionBannerSchema = new mongoose.Schema(
  {
    type: { type: String, default: "all_section_banners", unique: true },
    sections: { type: [SectionSchema], required: true }, // holds all 3 sections
  },
  { timestamps: true }
);

module.exports = mongoose.model("SectionBanner", SectionBannerSchema);
