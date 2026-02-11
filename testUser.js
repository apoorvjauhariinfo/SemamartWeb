// backend/test-generate-user-pdf.js
const path = require("path");
const generateUserPdf = require("./utils/generateUserPdf");

const mockUser = {
  _id: "USER-TEST-001",

  firstName: "Vansh",
  lastName: "Jaiswal",

  email: "user@test.com",
  phoneNumber: "9876543210",
  instituteName: "Demo Institute of Technology",
  gstNumber:"12673167136",
  createdAt: new Date(),

  addresses: [
    {
      reciever_name: "Vansh Jaiswal",
      instituteAddress1: "123 Main Road",
      instituteAddress2: "Near City Hospital",
      district: "New Delhi",
      state: "Delhi",
      pincode: "110001",
      phone: "9876543210",
    },
    {
      reciever_name: "Accounts Dept",
      instituteAddress1: "Warehouse Area",
      instituteAddress2: "",
      district: "Gurgaon",
      state: "Haryana",
      pincode: "122001",
      phone: "9123456789",
    },
  ],
};

(async () => {
  try {
    const pdfPath = await generateUserPdf(mockUser);

    console.log("✅ User PDF created:", pdfPath);
    console.log(
      "📂 Full path:",
      path.join(process.cwd(), "uploads", pdfPath)
    );
  } catch (err) {
    console.error("❌ Failed to generate user PDF:", err);
  }
})();
