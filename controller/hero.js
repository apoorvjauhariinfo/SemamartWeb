const express = require("express");
const router = express.Router();
const HeroSection = require("../model/heroitem");
const { uploadV2 } = require("../multer");
const { isAuthenticated,hasPermission } = require("../middleware/auth");

/* ================= SAVE / UPDATE HERO SECTION ================= */
router.post("/", uploadV2.array("heroImages"), 
isAuthenticated,
hasPermission("UploadImage"),
  
async (req, res) => {
  try {
    const items = JSON.parse(req.body.heroData);
    const deletedIds = req.body.deletedIds
      ? JSON.parse(req.body.deletedIds)
      : [];

    const files = req.files || [];

    let hero = await HeroSection.findOne();
    if (!hero) {
      hero = new HeroSection({
        leftBanner: {},
        rightBanner: {},
        sliders: [],
      });
    }

    /* ---------- MAP FILES ---------- */
    const fileMap = {};
    files.forEach((f) => {
      fileMap[f.originalname] = f.filename;
    });

    /* ---------- DELETE SLIDERS ---------- */
    if (deletedIds.length) {
      hero.sliders = hero.sliders.filter(
        (s) => !deletedIds.includes(s._id.toString())
      );
    }

    /* ---------- UPSERT ITEMS ---------- */
    items.forEach((item) => {
      /* LEFT BANNER */
      if (item.type === "banner-left") {
        hero.leftBanner.name = item.name;
        hero.leftBanner.link = item.link;
        if (fileMap[item.fileName]) {
          hero.leftBanner.imagePath = fileMap[item.fileName];
        }
      }

      /* RIGHT BANNER */
      if (item.type === "banner-right") {
        hero.rightBanner.name = item.name;
        hero.rightBanner.link = item.link;
        if (fileMap[item.fileName]) {
          hero.rightBanner.imagePath = fileMap[item.fileName];
        }
      }

      /* SLIDERS */
      if (item.type === "slider") {
        if (item.id) {
          const slider = hero.sliders.id(item.id);
          if (slider) {
            slider.name = item.name;
            slider.link = item.link;
            if (fileMap[item.fileName]) {
              slider.imagePath = fileMap[item.fileName];
            }
          }
        } else {
          hero.sliders.push({
            name: item.name,
            link: item.link,
            imagePath: fileMap[item.fileName] || "",
          });
        }
      }
    });

    await hero.save();

    res.json({ success: true, hero });
  } catch (err) {
    console.error("Hero save error:", err);
    res.status(500).json({ success: false });
  }
});

/* ================= FETCH HERO SECTION ================= */
router.get("/getallimg", 
  isAuthenticated, 
  hasPermission("UploadImage"),
 
  async (_, res) => {
  try {
    const data = await HeroSection.find().sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

router.get("/getheroimg", 

  async (_, res) => {
  try {
    const data = await HeroSection.find().sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
