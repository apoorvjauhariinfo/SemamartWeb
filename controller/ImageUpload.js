const { uploadV2 } = require("../multer");
const fs = require("fs");
const path = require("path");

const subFolders = {
    bannerimg: "bannerimg",
    slider: "sliders",
};

exports.uploadImages = (req, res) => {
    const type = req.params.type;

    // Validate type
    if (!["bannerimg", "slider"].includes(type)) {
        return res.status(400).json({ error: "Invalid type" });
    }

    // Ensure destination folder exists
    const folderPath = path.join(__dirname, "..", "uploads", subFolders[type]);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    // Configure multer for this request
    const upload = uploadV2.array(type);

    upload(req, res, (err) => {
        if (err) {
            console.error("Multer error:", err);
            return res.status(500).json({ error: "Upload failed", details: err.message });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        // Rename files to include banner/slider at the end
        const files = req.files.map((file) => {
            const ext = path.extname(file.filename); // original extension
            const baseName = path.basename(file.filename, ext); // original name without extension
            const newFileName = `${baseName}-${type}${ext}`; // e.g., myimage-banner.jpg

            const oldPath = file.path;
            const newPath = path.join(path.dirname(oldPath), newFileName);

            fs.renameSync(oldPath, newPath);

            return `/uploads/${subFolders[file.fieldname]}/${newFileName}`;
        });

        return res.json({ images: files });
    });
};
