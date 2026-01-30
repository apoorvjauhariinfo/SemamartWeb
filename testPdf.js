const generateOrderPdf = require("./utils/generateOrderPdf");

const mockOrder = {
  _id: "TEST1234568",
  qty: 2,
  unitPrice: 499243,
  tax: 18,
  verifiedAt: new Date(),
  
  variant: {
    productId: {
      name: "Sample Medical Product hbhsbhvbhdshbvnvhadvb",
      hsn: "3004",
      tax: 18,
      dispatchCity: "Delhi",
    },
  },

  user: {
    firstName: "Vansh",
    lastName: "Jaiswal",
    email: "test@example.com",
    instituteName: "Demo Institute",
    instituteAddress1: "Street 1",
    city: "Delhi",
    state: "Delhi",
    pincode: "110045",
  },

  shippingAddress: {
    reciever_name: "Vansh Jaiswal",
    addressLine1: "Shipping Street",
    city: "Delhi",
    state: "Delhi",
    pincode: "110045",
    phone: "9999999999",
  },
};

(async () => {
  const path = await generateOrderPdf(mockOrder);
  console.log("PDF created at:", path);
})();
