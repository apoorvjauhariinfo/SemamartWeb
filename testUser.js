// backend/testpdf.js
const path = require("path");
const generateOrderPdf = require("./utils/generateOrderPdf");

// ---- mock user ----
const testUser = {
  firstName: "Vansh",
  lastName: "Jaiswal",
  email: "vansh@test.com",

  instituteName: "Demo Institute of Medical Sciences",
  instituteAddress1: "317, SS Plaza",
  instituteAddress2: "Mahavir Enclave",
  city: "Delhi",
  state: "Delhi",
  pincode: "110045",

  addresses: [
    {
      name: "Vansh Jaiswal",
      addressLine1: "Billing Street 1",
      addressLine2: "Near Metro Station",
      city: "Delhi",
      state: "Delhi",
      pincode: "110045",
    },
  ],
};

// ---- mock order ----
const mockOrder = {
  _id: "TEST_" + Date.now(),

  qty: 2,
  unitPrice: 499243,
  tax: 18,
  verifiedAt: new Date(),

  variant: {
    productId: {
      name: "Sample Medical Product hbhsbhvbhdshbvnvhadvb (Long Name Test)",
      hsn: "3004",
      tax: 18,
      dispatchState: "Delhi",
      dispatchDistrict: "King",
    },
  },

  user: testUser,

  shippingAddress: {
    reciever_name: "Vansh Jaiswal",
    addressLine1: "Shipping Street 99",
    addressLine2: "Near Hospital",
    city: "Delhi",
    district: "South West",
    state: "Delhi",
    pincode: "110045",
    phone: "9999999999",
  },

  // optional: multiple items test
  items: [
    {
      name: "Sample Medical Product hbhsbhvbhdshbvnvhadvb",
      hsn: "3004",
      qty: 2,
      unitPrice: 499243,
    },
    {
      name: "Second Product With Very Very Long Description For Wrapping Test",
      hsn: "9018",
      qty: 1,
      unitPrice: 1200,
    },
  ],
};

(async () => {
  try {
    console.log("🧪 Generating test PDF...");

    const pdfRelPath = await generateOrderPdf(mockOrder);

    console.log("✅ PDF created successfully!");
    console.log("📄 Relative path:", pdfRelPath);
    console.log(
      "📁 Absolute path:",
      path.join(process.cwd(), "uploads", pdfRelPath)
    );
  } catch (err) {
    console.error("❌ Test PDF generation failed:");
    console.error(err);
  }
})();
