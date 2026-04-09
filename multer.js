const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, res, cb) {
    cb(null, path.join(__dirname, "./uploads"));
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const [filename, extension] = file.originalname.split(".");
    // cb(null, filename + "-" + uniqueSuffix + ".png");
    cb(null, filename + "-" + uniqueSuffix + "." + extension);
  },
});

const subFolders = {
  images: "images",
  thumbnail: "images",
  variantImages: "images",
  shortVideo: "videos",
  certificate: "docs",
  oemLetter: "docs",
  productComparisionSheet: "docs",
  productCompilance: "docs",
  msds_ifu_leaflet: "docs",
  amc_cms: "docs",
  file: "docs",
  profilePic: "images",
  banner: "images",
  image: "images",
  payment_file:"payment-docs",
  heroImages: "images",
  tracking_file:"payment-docs",
};

const storageV2 = multer.diskStorage({
  destination: (_req, file, cb) => {
    const sub = subFolders[file.fieldname];
    const targetDir = path.join(__dirname, "uploads", sub);
    cb(null, targetDir);
  },

  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  },
});

const storageDocUpdate = multer.diskStorage({
  destination: function (req, file, cb) {
    const targetDir = path.join(__dirname, "uploads/docs");
    cb(null, targetDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

exports.uploadV2 = multer({ storage: storageV2 });
exports.uploadDocUpdate = multer({ storage: storageDocUpdate });
exports.upload = multer({ storage: storage });
