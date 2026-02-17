const express = require("express");
const router = express.Router();
const path = require("path");
const SectionBanner = require("../model/sectionbanner");
const multer = require("multer");
const { isAuthenticated,hasPermission } = require("../middleware/auth");

// Multer storage: force all images into uploads/images
const storageImages = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "../uploads/images")); // store all images here
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  },
});

const uploadImages = multer({ storage: storageImages });

/**
 * POST: Save or update ALL section banners in ONE document
 */
router.post(
  "/",
  uploadImages.fields([
    { name: "section1_left", maxCount: 1 },
    { name: "section1_right", maxCount: 1 },
    { name: "section2_left", maxCount: 1 },
    { name: "section2_right", maxCount: 1 },
    { name: "section3_left", maxCount: 1 },
    { name: "section3_right", maxCount: 1 },
  ]),
  hasPermission("uploadImage"),
    isAuthenticated,
  async (req, res) => {
    try {
      const sections = JSON.parse(req.body.sections);

      if (sections.length !== 3) {
        return res.status(400).json({ message: "Must provide 3 sections" });
      }

      // Build left/right images from uploaded files
      const sectionFiles = [
        {
          leftFile: req.files.section1_left?.[0],
          rightFile: req.files.section1_right?.[0],
        },
        {
          leftFile: req.files.section2_left?.[0],
          rightFile: req.files.section2_right?.[0],
        },
        {
          leftFile: req.files.section3_left?.[0],
          rightFile: req.files.section3_right?.[0],
        },
      ];

      // Check for missing images if not previously set
      for (let i = 0; i < 3; i++) {
        const sec = sectionFiles[i];
        if (!sec.leftFile && !sections[i].left.image) {
          return res.status(400).json({ message: `Left image missing for section ${i + 1}` });
        }
        if (!sec.rightFile && !sections[i].right.image) {
          return res.status(400).json({ message: `Right image missing for section ${i + 1}` });
        }
      }

      // Find existing document (only one)
      let bannerDoc = await SectionBanner.findOne({ type: "all_section_banners" });

      const updatedData = {
        type: "all_section_banners",
        sections: sections.map((sec, i) => ({
          title: sec.title || `Section Banner ${i + 1}`,
          left: {
            name: sec.left.name,
            link: sec.left.link,
            image: sectionFiles[i].leftFile
              ? sectionFiles[i].leftFile.filename
              : sec.left.image,
          },
          right: {
            name: sec.right.name,
            link: sec.right.link,
            image: sectionFiles[i].rightFile
              ? sectionFiles[i].rightFile.filename
              : sec.right.image,
          },
        })),
      };

      if (bannerDoc) {
        bannerDoc.sections = updatedData.sections;
        await bannerDoc.save();
      } else {
        bannerDoc = new SectionBanner(updatedData);
        await bannerDoc.save();
      }

      res.status(200).json({
        success: true,
        message: "Section banners saved successfully ✅",
        data: bannerDoc,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * GET: Fetch ALL section banners
 */
router.get("/getallsectionbanner",
  hasPermission("uploadImage"),
    isAuthenticated,
  async (req, res) => {
  try {
    const banners = await SectionBanner.find({}).sort({ createdAt: 1 });

    const formatted = banners
      .map((banner) =>
        banner.sections.map((section) => ({
          title: section.title,
          type: banner.type,
          left: {
            name: section.left?.name || "",
            link: section.left?.link || "",
            image: section.left?.image || "",
          },
          right: {
            name: section.right?.name || "",
            link: section.right?.link || "",
            image: section.right?.image || "",
          },
        }))
      )
      .flat();

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error("Fetch Section Banners Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch section banners" });
  }
});

module.exports = router;
