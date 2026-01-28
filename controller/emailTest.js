// const express = require("express");
// const router = express.Router();

// const sendOrderDeliveredCustomerEmail =
//   require("../utils/emails/orderDeliveredCustomer");

// /**
//  * TEST ROUTE — Order Delivered Email (Customer)
//  * URL: POST /api/v2/email-test/order-delivered
//  */
// router.post("/order-delivered", async (req, res) => {
//   try {
//     const {
//       email,
//       customerName = "Aakruti",
//       orderId = "TEST-ORDER-12345",
//       totalAmount = 1499,
//     } = req.body;

//     if (!email) {
//       return res.status(400).json({
//         success: false,
//         message: "Email is required",
//       });
//     }

//     await sendOrderDeliveredCustomerEmail({
//       customerEmail: email,
//       customerName,
//       orderId,
//       totalAmount,
//     });

//     res.status(200).json({
//       success: true,
//       message: "Order Delivered test email sent successfully",
//     });
//   } catch (error) {
//     console.error("Email test error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to send test email",
//     });
//   }
// });

// module.exports = router;


// const express = require("express");
// const router = express.Router();

// const sendOrderPlacedCustomerEmail =
//   require("../utils/emails/orderPlacedCustomer");

// router.post("/order-placed", async (req, res) => {
//   try {
//     const {
//       email,
//       customerName = "Aakruti",
//       orderId = "SEMAMART-DEV-002",
//       productName = "Laboratory Test Kit",
//       qty = 2,
//       totalAmount = 2099,
//     } = req.body;

//     if (!email) {
//       return res.status(400).json({ success: false, message: "Email required" });
//     }

//     await sendOrderPlacedCustomerEmail({
//       customerEmail: email,
//       customerName,
//       orderId,
//       productName,
//       qty,
//       totalAmount,
//     });

//     res.json({
//       success: true,
//       message: "Order Placed test email sent",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();

// const sendOrderReceivedSellerEmail = require("../utils/emails/orderReceivedSeller");

// router.post("/seller-order-received", async (req, res) => {
//   try {
//     const {
//       email,
//       sellerName = "Semamart Seller",
//       orderId = "SEMAMART-SELLER-001",
//       productName = "Laboratory Diagnostic Kit",
//       qty = 2,
//       totalAmount = 3499,
//     } = req.body;

//     if (!email) {
//       return res.status(400).json({ success: false, message: "Email required" });
//     }

//     await sendOrderReceivedSellerEmail({
//       sellerEmail: email,
//       sellerName,
//       orderId,
//       productName,
//       qty,
//       totalAmount,
//     });

//     res.json({
//       success: true,
//       message: "Seller order received test email sent",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();

// const sendOrderShippedCustomerEmail = require("../utils/emails/orderShippedCustomer");

// router.post("/order-shipped", async (req, res) => {
//   try {
//     const {
//       email,
//       customerName = "Aakruti",
//       orderId = "SEMAMART-SHIP-001",
//       productName = "Laboratory Diagnostic Kit",
//       qty = 1,
//       totalAmount = 2099,
//     } = req.body;

//     if (!email) {
//       return res.status(400).json({ success: false, message: "Email required" });
//     }

//     await sendOrderShippedCustomerEmail({
//       customerEmail: email,
//       customerName,
//       orderId,
//       productName,
//       qty,
//       totalAmount,
//     });

//     res.json({
//       success: true,
//       message: "Order Shipped test email sent",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();

// const sendOrderShippedSellerEmail = require("../utils/emails/orderShippedSeller");

// router.post("/seller-order-shipped", async (req, res) => {
//   try {
//     const {
//       email,
//       sellerName = "Semamart Seller",
//       orderId = "SEMAMART-SHIP-SELLER-001",
//       productName = "Laboratory Diagnostic Kit",
//       qty = 1,
//       totalAmount = 2899,
//     } = req.body;

//     if (!email) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Email required" });
//     }

//     await sendOrderShippedSellerEmail({
//       sellerEmail: email,
//       sellerName,
//       orderId,
//       productName,
//       qty,
//       totalAmount,
//     });

//     res.json({
//       success: true,
//       message: "Seller order shipped test email sent",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();

// const sendOrderDeliveredSellerEmail =
//   require("../utils/emails/orderDeliveredSeller");

// router.post("/seller-order-delivered", async (req, res) => {
//   try {
//     const {
//       email,
//       sellerName = "Semamart Seller",
//       orderId = "SEMAMART-DELIVERED-SELLER-001",
//       items = [
//         { name: "Blood Test Kit", quantity: 2, price: 1499 },
//         { name: "Glucose Monitor", quantity: 1, price: 2199 }
//       ],
//       totalAmount = 5197,
//     } = req.body;

//     if (!email) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Email required" });
//     }

//     await sendOrderDeliveredSellerEmail({
//       sellerEmail: email,
//       sellerName,
//       orderId,
//       items,
//       totalAmount,
//     });

//     res.json({
//       success: true,
//       message: "Seller order delivered test email sent",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();

// const sendVerifyPaymentCustomerEmail =
//   require("../utils/emails/verifyPaymentCustomer");

// router.post("/verify-payment", async (req, res) => {
//   try {
//     const {
//       email,
//       customerName = "ABC Institute",
//       orderId = "SEMAMART-PAY-001",
//       items = [
//         { name: "Blood Test Kit", quantity: 2, price: 1499 },
//         { name: "Glucose Monitor", quantity: 1, price: 2199 }
//       ],
//       totalAmount = 5197,
//     } = req.body;

//     if (!email) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Email required" });
//     }

//     await sendVerifyPaymentCustomerEmail({
//       customerEmail: email,
//       customerName,
//       orderId,
//       items,
//       totalAmount,
//     });

//     res.json({
//       success: true,
//       message: "Verify payment email sent",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();

// const sendVerifyPaymentAdminEmail =
//   require("../utils/emails/verifyPaymentAdmin");

// router.post("/admin-verify-payment", async (req, res) => {
//   try {
//     const {
//       email,
//       instituteName = "ABC Institute of Medical Sciences",
//       orderId = "SEMAMART-ADMIN-PAY-001",
//       paymentMethod = "Bank Transfer",
//       items = [
//         { name: "Blood Test Kit", quantity: 2, price: 1499 },
//         { name: "Glucose Monitor", quantity: 1, price: 2199 }
//       ],
//       totalAmount = 5197,
//     } = req.body;

//     if (!email) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Admin email required" });
//     }

//     await sendVerifyPaymentAdminEmail({
//       adminEmail: email,
//       instituteName,
//       orderId,
//       items,
//       totalAmount,
//       paymentMethod,
//     });

//     res.json({
//       success: true,
//       message: "Admin verify payment email sent",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();

// const sendSelfVerifyCustomerEmail =
//   require("../utils/emails/selfVerifyCustomer");

// router.post("/self-verify-customer", async (req, res) => {
//   try {
//     const {
//       email,
//       customerName = "ABC Institute",
//       verificationToken = "dummy-verification-token-123",
//     } = req.body;

//     if (!email) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Email required" });
//     }

//     await sendSelfVerifyCustomerEmail({
//       customerEmail: email,
//       customerName,
//       verificationToken,
//     });

//     res.json({
//       success: true,
//       message: "Self verification email sent",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();

// const sendRegistrationCompleteCustomerEmail =
//   require("../utils/emails/registrationCompleteCustomer");

// router.post("/registration-complete-customer", async (req, res) => {
//   try {
//     const {
//       email,
//       customerName = "ABC Institute",
//     } = req.body;

//     if (!email) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Email required" });
//     }

//     await sendRegistrationCompleteCustomerEmail({
//       customerEmail: email,
//       customerName,
//     });

//     res.json({
//       success: true,
//       message: "Registration complete email sent",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// module.exports = router;


// const express = require("express");
// const router = express.Router();

// const sendSelfVerifySellerEmail =
//   require("../utils/emails/selfVerifySeller");

// router.post("/seller-self-verify", async (req, res) => {
//   try {
//     const {
//       email,
//       sellerName = "ABC Diagnostics",
//       verificationToken = "seller-verify-token-123",
//     } = req.body;

//     if (!email) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Seller email required" });
//     }

//     await sendSelfVerifySellerEmail({
//       sellerEmail: email,
//       sellerName,
//       verificationToken,
//     });

//     res.json({
//       success: true,
//       message: "Seller self verification email sent",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();

// const sendNewSellerAdminVerifyEmail =
//   require("../utils/emails/newSellerAdminVerify");

// router.post("/admin-seller-verify", async (req, res) => {
//   try {
//     const {
//       email,
//       sellerName = "ABC Diagnostics",
//       sellerEmail = "seller@email.com",
//     } = req.body;

//     if (!email) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Admin email required" });
//     }

//     await sendNewSellerAdminVerifyEmail({
//       adminEmail: email,
//       sellerName,
//       sellerEmail,
//     });

//     res.json({
//       success: true,
//       message: "Admin seller verification email sent",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();

// const sendRegistrationCompleteSellerEmail =
//   require("../utils/emails/registrationCompleteSeller");

// router.post("/seller-registration-complete", async (req, res) => {
//   try {
//     const {
//       email,
//       sellerName = "ABC Diagnostics",
//     } = req.body;

//     if (!email) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Seller email required" });
//     }

//     await sendRegistrationCompleteSellerEmail({
//       sellerEmail: email,
//       sellerName,
//     });

//     res.json({
//       success: true,
//       message: "Seller registration complete email sent",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();

// const sendProductOutOfStockSellerEmail =
//   require("../utils/emails/productOutOfStockSeller");

// router.post("/seller-product-out-of-stock", async (req, res) => {
//   try {
//     const {
//       email,
//       sellerName = "ABC Diagnostics",
//       products = [
//         { name: "Blood Test Collection Kit" },
//         { name: "Rapid Antigen Test" },
//       ],
//     } = req.body;

//     if (!email) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Seller email required" });
//     }

//     await sendProductOutOfStockSellerEmail({
//       sellerEmail: email,
//       sellerName,
//       products,
//     });

//     res.json({
//       success: true,
//       message: "Product out of stock email sent to seller",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// module.exports = router;


// const express = require("express");
// const router = express.Router();

// const sendProductBelowMOQSellerEmail =
//   require("../utils/emails/productBelowMOQSeller");

// router.post("/seller-product-below-moq", async (req, res) => {
//   try {
//     const {
//       email,
//       sellerName = "ABC Diagnostics",
//       products = [
//         {
//           name: "Blood Test Collection Kit",
//           currentStock: 8,
//           moq: 15,
//         },
//         {
//           name: "Rapid Antigen Test",
//           currentStock: 12,
//           moq: 20,
//         },
//       ],
//     } = req.body;

//     if (!email) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Seller email required" });
//     }

//     await sendProductBelowMOQSellerEmail({
//       sellerEmail: email,
//       sellerName,
//       products,
//     });

//     res.json({
//       success: true,
//       message: "Product below MOQ alert email sent to seller",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// module.exports = router;


// const express = require("express");
// const router = express.Router();

// const sendProductBackInStockCustomerEmail =
//   require("../utils/emails/productBackInStockCustomer");

// router.post("/product-back-in-stock", async (req, res) => {
//   try {
//     const {
//       email,
//       customerName = "ABC Institute",
//       products = [
//         {
//           name: "Blood Test Collection Kit",
//           slug: "blood-test-collection-kit",
//         },
//         {
//           name: "Rapid Antigen Test",
//           slug: "rapid-antigen-test",
//         },
//       ],
//     } = req.body;

//     if (!email) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Customer email required" });
//     }

//     await sendProductBackInStockCustomerEmail({
//       customerEmail: email,
//       customerName,
//       products,
//     });

//     res.json({
//       success: true,
//       message: "Product back in stock email sent to customer",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();

// const sendBulkOrderRequestAdminEmail =
//   require("../utils/emails/bulkOrderRequestAdmin");

// router.post("/bulk-order-request", async (req, res) => {
//   try {
//     const {
//       email,
//       instituteName = "ABC Institute of Medical Sciences",
//       instituteEmail = "institute@email.com",
//       institutePhone = "+91 9876543210",
//       products = [
//         { name: "Blood Test Collection Kit", quantity: 500 },
//         { name: "Rapid Antigen Test", quantity: 1000 },
//       ],
//       notes = "Looking for best pricing and delivery within 7 days.",
//     } = req.body;

//     if (!email) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Admin email required" });
//     }

//     await sendBulkOrderRequestAdminEmail({
//       adminEmail: email,
//       instituteName,
//       instituteEmail,
//       institutePhone,
//       products,
//       notes,
//     });

//     res.json({
//       success: true,
//       message: "Bulk order request email sent to admin",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();

// const sendNewInstituteRegisteredAdminEmail =
//   require("../utils/emails/newInstituteRegisteredAdmin");

// router.post("/admin-institute-registered", async (req, res) => {
//   try {
//     const {
//       email,
//       instituteName = "ABC Institute of Medical Sciences",
//       instituteEmail = "institute@email.com",
//       institutePhone = "+91 9876543210",
//     } = req.body;

//     if (!email) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Admin email required" });
//     }

//     await sendNewInstituteRegisteredAdminEmail({
//       adminEmail: email,
//       instituteName,
//       instituteEmail,
//       institutePhone,
//     });

//     res.json({
//       success: true,
//       message: "New institute registration email sent to admin",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();

// const sendBulkOrderRequestCustomerEmail =
//   require("../utils/emails/bulkOrderRequestCustomer");

// router.post("/bulk-order-request-customer", async (req, res) => {
//   try {
//     const {
//       email,
//       customerName = "ABC Institute of Medical Sciences",
//       products = [
//         { name: "Blood Test Collection Kit", quantity: 500 },
//         { name: "Rapid Antigen Test", quantity: 1000 },
//       ],
//       notes = "Please share quotation with GST included.",
//     } = req.body;

//     if (!email) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Customer email required" });
//     }

//     await sendBulkOrderRequestCustomerEmail({
//       customerEmail: email,
//       customerName,
//       products,
//       notes,
//     });

//     res.json({
//       success: true,
//       message: "Bulk order request received email sent to customer",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();

// const sendOrderReceivedAdminEmail =
//   require("../utils/emails/orderReceivedAdmin");

// router.post("/admin-order-received", async (req, res) => {
//   const {
//     email,
//     instituteName = "ABC Institute",
//     orderId = "ORD-ADMIN-001",
//     items = [
//       { name: "Blood Test Kit", quantity: 2, price: 1499 },
//     ],
//     totalAmount = 2998,
//   } = req.body;

//   await sendOrderReceivedAdminEmail({
//     adminEmail: email,
//     orderId,
//     instituteName,
//     items,
//     totalAmount,
//   });

//   res.json({ success: true });
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();

// const sendOrderShippedAdminEmail =
//   require("../utils/emails/orderShippedAdmin");

// router.post("/admin-order-shipped", async (req, res) => {
//   try {
//     const {
//       email,
//       orderId = "SEMAMART-ADMIN-SHIP-001",
//       instituteName = "ABC Institute of Medical Sciences",
//     } = req.body;

//     if (!email) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Admin email required" });
//     }

//     await sendOrderShippedAdminEmail({
//       adminEmail: email,
//       orderId,
//       instituteName,
//     });

//     res.json({
//       success: true,
//       message: "Admin order shipped email sent",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();

const sendOrderDeliveredAdminEmail =
  require("../utils/emails/orderDeliveredAdmin");

router.post("/admin-order-delivered", async (req, res) => {
  try {
    const {
      email,
      orderId = "SEMAMART-ADMIN-DEL-001",
      instituteName = "ABC Institute of Medical Sciences",
    } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Admin email required" });
    }

    await sendOrderDeliveredAdminEmail({
      adminEmail: email,
      orderId,
      instituteName,
    });

    res.json({
      success: true,
      message: "Admin order delivered email sent",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
