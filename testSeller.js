// backend/test-generate-seller-pdf.js
const path = require("path");
const generateSellerPdf = require("./utils/generateSellerPdf");

const mockSeller = {
  _id: "SELLER-TEST-001",

  firstName: "Vansh",
  lastName: "Jaiswal",

  businessName: "Demo Medical Suppliers Pvt Ltd",
  businessType: "Wholesaler",

  gstNumber: "07ABCDE1234F1Z5",

  email: "seller@test.com",
  phoneNumber: "9876543210",

  // must exist if you want images, otherwise leave null
  profilePic: null, // example: "profile.jpg"
  banner: null,     // example: "banner.jpg"

  createdAt: new Date(),

  // optional – not directly used but common in mongoose docs
  updatedAt: new Date(),
};

(async () => {
  try {
    const pdfPath = await generateSellerPdf(mockSeller);

    console.log("✅ Seller PDF created:", pdfPath);
    console.log(
      "📂 Full path:",
      path.join(process.cwd(), "uploads", pdfPath)
    );
  } catch (err) {
    console.error("❌ Failed to generate seller PDF:", err);
  }
})();
