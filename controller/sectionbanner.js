const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const SectionBanner = require("../model/sectionbanner");

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/hero");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });
/**
 * POST: Save or update ALL section banners in ONE document
 */
router.post(
  "/",
  upload.fields([
    { name: "section1_left", maxCount: 1 },
    { name: "section1_right", maxCount: 1 },
    { name: "section2_left", maxCount: 1 },
    { name: "section2_right", maxCount: 1 },
    { name: "section3_left", maxCount: 1 },
    { name: "section3_right", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const sections = JSON.parse(req.body.sections);

      if (sections.length !== 3) {
        return res.status(400).json({ message: "Must provide 3 sections" });
      }

      // Build left/right images with uploaded files
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

      // Check for missing images
      for (let i = 0; i < 3; i++) {
        const sec = sectionFiles[i];
        if (!sec.leftFile && !sections[i].left.image) {
          return res.status(400).json({ message: `Left image missing for section ${i + 1}` });
        }
        if (!sec.rightFile && !sections[i].right.image) {
          return res.status(400).json({ message: `Right image missing for section ${i + 1}` });
        }
      }

      // Find existing document (there should be only ONE)
      let bannerDoc = await SectionBanner.findOne({ type: "all_section_banners" });

      const updatedData = {
        type: "all_section_banners",
        sections: sections.map((sec, i) => ({
          title: sec.title || `Section Banner ${i + 1}`,
          left: {
            name: sec.left.name,
            link: sec.left.link,
            image: sectionFiles[i].leftFile
              ? `${sectionFiles[i].leftFile.filename}`
              : sec.left.image, // keep old if not uploaded
          },
          right: {
            name: sec.right.name,
            link: sec.right.link,
            image: sectionFiles[i].rightFile
              ? `${sectionFiles[i].rightFile.filename}`
              : sec.right.image, // keep old if not uploaded
          },
        })),
      };

      if (bannerDoc) {
        // Update existing document
        bannerDoc.sections = updatedData.sections;
        await bannerDoc.save();
      } else {
        // Create new document
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
router.get("/getallsectionbanner", async (req, res) => {
  try {
    // Fetch all section banner documents
    const banners = await SectionBanner.find({}).sort({ createdAt: 1 });

    // Normalize response for frontend
    const formatted = banners.map((banner) => {
      return banner.sections.map((section) => ({
        title: section.title,
        type: banner.type, // or section.type if needed
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
      }));
    }).flat(); // flatten array since map returns nested arrays

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Fetch Section Banners Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch section banners",
    });
  }
});


module.exports = router;
