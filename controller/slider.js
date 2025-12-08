const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Image = require("../model/slider"); // Make sure your model is correct

// Multer storage (store in uploads/images)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/images/"),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Create new image (slider or banner) with file upload
router.post("/", upload.single("image"), async (req, res) => {
    try {
        const { title, link, type } = req.body;

        if (!req.file) return res.status(400).json({ error: "No image uploaded" });

        const image = new Image({
            title,
            link,
            type,
            imageUrl: `/uploads/images/${req.file.filename}` // store relative path
        });

        await image.save();
        res.json({ message: "Image added!", image });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all sliders
router.get("/sliders", async (req, res) => {
    try {
        const sliders = await Image.find({ type: "slider" });
        res.json(sliders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get left banners
router.get("/banners-left", async (req, res) => {
    try {
        const banners = await Image.find({ type: "banner-left" });
        res.json(banners);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get right banners
router.get("/banners-right", async (req, res) => {
    try {
        const banners = await Image.find({ type: "banner-right" });
        res.json(banners);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete image by ID
router.delete("/:id", async (req, res) => {
    try {
        const deletedImage = await Image.findByIdAndDelete(req.params.id);
        if (!deletedImage) return res.status(404).json({ message: "Image not found" });

        // Optional: delete file from uploads/images folder
        const fs = require("fs");
        const filePath = `uploads/images/${path.basename(deletedImage.imageUrl)}`;
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        res.json({ message: "Image deleted!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
