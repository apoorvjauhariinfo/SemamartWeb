const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const HeroSection = require("../model/heroitem");

/* ================= MULTER ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/hero");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

/* ================= SAVE / UPDATE ================= */
router.post("/", upload.array("heroImages"), async (req, res) => {
  try {
    const items = JSON.parse(req.body.heroData);
    const files = req.files;

    let hero = await HeroSection.findOne();
    if (!hero) {
      hero = new HeroSection({
        leftBanner: {},
        rightBanner: {},
        sliders: [],
      });
    }

    const fileMap = {};
    files.forEach((f) => (fileMap[f.originalname] = `${f.filename}`));

    items.forEach((item) => {
      /* ---------- BANNERS ---------- */
      if (item.type === "banner-left") {
        hero.leftBanner.name = item.name;
        hero.leftBanner.link = item.link;
        if (fileMap[item.fileName])
          hero.leftBanner.imagePath = fileMap[item.fileName];
      }

      if (item.type === "banner-right") {
        hero.rightBanner.name = item.name;
        hero.rightBanner.link = item.link;
        if (fileMap[item.fileName])
          hero.rightBanner.imagePath = fileMap[item.fileName];
      }

      /* ---------- SLIDERS ---------- */
      if (item.type === "slider") {
        if (item.id) {
          // ✅ update existing
          const slider = hero.sliders.id(item.id);
          if (slider) {
            slider.name = item.name;
            slider.link = item.link;
            if (fileMap[item.fileName])
              slider.imagePath = fileMap[item.fileName];
          }
        } else {
          // ✅ add new
          hero.sliders.push({
            name: item.name,
            link: item.link,
            imagePath: fileMap[item.fileName] || "",
          });
        }
      }
    });

    await hero.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* ================= FETCH ================= */
router.get("/getallimg", async (_, res) => {
  const data = await HeroSection.find().sort({ createdAt: -1 });
  res.json({ success: true, data });
});

module.exports = router;