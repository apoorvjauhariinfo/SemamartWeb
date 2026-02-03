const express = require("express");
const path = require("path");
const router = express.Router();
const fs = require("fs");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const Shop = require("../model/shop");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const { uploadV2 } = require("../multer");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const mongoose = require("mongoose");
const generateSellerPdf = require("../utils/generateSellerPdf");
const sendShopToken = require("../utils/shopToken");
const user = require("../model/user");
const addActivityLog = require("../utils/activityLogHelper");
const sentMailToAdmin = require("../utils/mailToAdmin");
const sendNewSellerAdminVerifyEmail = require("../utils/emails/newSellerAdminVerify");
const sendSelfVerifySellerEmail = require("../utils/emails/selfVerifySeller");
const sendRegistrationCompleteSellerEmail = require("../utils/emails/registrationCompleteSeller");

// create shop (seller email verification)
// Now: create Shop document immediately (verified: false), generate registration PDF, then send activation email.
// PDF errors won't block registration or email.
router.post(
  "/create-shop",
  uploadV2.fields([{ name: "profilePic" }, { name: "banner" }]),
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const existingSeller = await Shop.findOne({ email });

      if (existingSeller) {
        // Delete uploaded files if duplicate
        if (req.files && req.files["profilePic"]) {
          try {
            fs.unlinkSync(
              `uploads/images/${req.files["profilePic"][0].filename}`
            );
          } catch (e) {
            /* ignore */
          }
        }
        if (req.files && req.files["banner"]) {
          try {
            fs.unlinkSync(`uploads/images/${req.files["banner"][0].filename}`);
          } catch (e) {
            /* ignore */
          }
        }
        return next(new ErrorHandler("Seller already exists", 400));
      }

      const files = req.files || {};
      const profilePic = files["profilePic"]
        ? files["profilePic"][0].filename
        : null;
      const banner = files["banner"] ? files["banner"][0].filename : null;

      const sellerData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        businessName: req.body.businessName,
        gstNumber: req.body.gstNumber,
        businessType: req.body.businessType,
        email,
        password: req.body.password,
        phoneNumber: req.body.phoneNumber,
        profilePic,
        banner,
        verified: false, // not verified until activation
      };

      // ✅ Create seller now (so we can generate PDF immediately)
      const seller = await Shop.create(sellerData);

      // ---------- GENERATE REGISTRATION PDF FOR SELLER IMMEDIATELY ----------
      try {
        // generateSellerPdf should return relative path like 'uploads/pdfs/<id>.pdf'
        const relPdfPath = await generateSellerPdf(seller);
        if (relPdfPath) {
          seller.registrationPdf = relPdfPath;
          await seller.save();
          console.log(
            "✅ Seller registration PDF created at registration:",
            relPdfPath
          );
        } else {
          console.warn(
            "⚠️ generateSellerPdf returned falsy for seller:",
            seller._id
          );
        }
      } catch (pdfErr) {
        // Log but do not block the flow
        console.error(
          "⚠️ Seller PDF generation failed at registration for",
          seller._id,
          pdfErr
        );
      }
      // ---------- END PDF GENERATION ----------

      // ✅ Generate activation token (we keep the token payload minimal)
      const activationToken = createActivationToken({ email });

      // ✅ Dynamic base URL detection
      const frontendBaseUrl =
        process.env.FRONTEND_URL ||
        (process.env.NODE_ENV === "PRODUCTION"
          ? "https://semamart.com"
          : process.env.NODE_ENV === "TEST"
            ? "http://test.semamart.com"
            : "http://localhost:5173");

      const activationUrl = `${frontendBaseUrl}/seller/activation/${activationToken}`;

      console.log("📩 Sending seller activation mail:", activationUrl);

      // ✅ Send activation email
      // await sendMail({
      //   email,
      //   subject: "Verify your Semamart Seller Account",
      //   html: `
      //     <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#f9f9f9;padding:20px;border-radius:8px;">
      //       <h2 style="color:#333;">Welcome to Semamart, ${req.body.firstName}!</h2>
      //       <p style="color:#555;">Please verify your email to activate your seller account.</p>
      //       <a href="${activationUrl}" style="display:inline-block;padding:10px 20px;background:#007bff;color:#fff;border-radius:4px;text-decoration:none;">Verify Email</a>
      //       <p style="font-size:13px;color:#777;margin-top:15px;">
      //         If the button doesn’t work, copy and paste this link into your browser:
      //         <br><a href="${activationUrl}" style="color:#007bff;">${activationUrl}</a>
      //       </p>
      //       <p style="font-size:12px;color:#aaa;">© ${new Date().getFullYear()} Semamart. All rights reserved.</p>
      //     </div>
      //   `,
      // });
      await sendSelfVerifySellerEmail({
        sellerEmail: seller.email,
        sellerName: seller.firstName,
        verificationToken: activationToken,
      });

      res.status(201).json({
        success: true,
        message: `Verification email sent to ${email}. Please check your inbox.`,
        sellerId: seller._id,
      });
    } catch (error) {
      console.error("❌ Error during seller creation:", error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// create activation token
const createActivationToken = (payload) => {
  return jwt.sign(payload, process.env.ACTIVATION_SECRET, {
    expiresIn: "10m",
  });
};

// replace the existing "/update-seller-info" handler with this
router.put(
  "/update-seller-info",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      // Allowed updatable fields — keep this list minimal and explicit
      const allowedFields = [
        "firstName",
        "lastName",
        "businessName",
        "gstNumber",
        "description",
        "address",
        "phoneNumber",
        "zipCode",
      ];

      // Build update object only with keys actually present in req.body
      const update = {};
      allowedFields.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(req.body, key)) {
          // only set if key exists on request body (even if empty string is intentionally sent)
          update[key] = req.body[key];
        }
      });

      if (Object.keys(update).length === 0) {
        return next(
          new ErrorHandler("No valid fields provided to update", 400)
        );
      }

      // Perform partial update safely
      const shop = await Shop.findByIdAndUpdate(
        req.seller._id,
        { $set: update },
        { new: true, runValidators: true }
      );

      if (!shop) return next(new ErrorHandler("User not found", 400));

      // Record activity log (optional — keep your existing metadata logic if you want)
      await addActivityLog({
        userId: shop._id,
        userType: "Shop",
        action: "Vendor Update",
        entityType: "Shop",
        entityId: shop._id,
        description: `${shop.businessName} updated shop profile information`,
        metaData: update,
      });

      res.status(201).json({
        success: true,
        shop,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// PUT /api/v2/shop/update-seller-password
router.put(
  "/update-seller-password",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      // Ensure request contains required fields
      const { currentPassword, newPassword, confirmPassword } = req.body;
      if (!currentPassword || !newPassword || !confirmPassword) {
        return next(
          new ErrorHandler("Please provide all password fields", 400)
        );
      }

      if (newPassword !== confirmPassword) {
        return next(
          new ErrorHandler(
            "New password and confirm password do not match",
            400
          )
        );
      }

      // Find seller with password field selected
      const seller = await Shop.findById(req.seller._id).select("+password");
      if (!seller) return next(new ErrorHandler("Seller not found", 404));

      const isMatch = await seller.comparePassword(currentPassword);
      if (!isMatch) {
        return next(new ErrorHandler("Current password is incorrect", 400));
      }

      // Set new password (this triggers your pre-save hook to hash it)
      seller.password = newPassword;
      await seller.save();

      res.status(200).json({
        success: true,
        message: "Password updated successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// activate seller
// Updated: prefer to verify an already-created Shop (created at /create-shop).
// If a Shop by email exists and is unverified -> mark verified true.
// If not present (older flows), create the Shop now.
router.post(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { activation_token } = req.body;
      const decodedSeller = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET
      );

      if (!decodedSeller) {
        return next(new ErrorHandler("Invalid or expired token", 400));
      }

      const {
        firstName,
        lastName,
        email,
        businessName,
        gstNumber,
        phoneNumber,
        businessType,
        password,
        profilePic,
        banner,
      } = decodedSeller;

      // ✅ Check again safely
      const existingSeller = await Shop.findOne({ email });
      if (existingSeller) {
        console.log("⚠️ Seller already activated:", email);
        return res.status(200).json({
          success: true,
          message: "Seller already verified. Please log in.",
        });
      }

      // ✅ Create seller in DB
      const seller = await Shop.create({
        firstName,
        lastName,
        email,
        businessName,
        gstNumber,
        phoneNumber,
        businessType,
        password,
        profilePic,
        banner,
      });

      await addActivityLog({
        userId: seller._id,
        userType: "Shop",
        action: "Vendor Add",
        entityType: "Shop",
        entityId: seller._id,
        description: seller.businessName + " registered",
      });

      // const mailSubject = "New seller registered"
      // const htmlBody = `
      //   <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
      //     <h2 style="color: #2c3e50;">New Seller Registration</h2>
      //     <p>A new seller has just registered on the platform. Please review their details and proceed with the verification process.</p>
      //     <div style="margin-top: 20px; padding: 15px; background: #f7f7f7; border-left: 4px solid #3498db;">
      //       <p style="margin: 0;"><strong>Business Name:</strong> ${businessName}</p>
      //       <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
      //       <p style="margin: 0;"><strong>Registration Date:</strong> ${new Date(seller.createdAt).toLocaleDateString("en-IN")}</p>
      //     </div>
      //   </div>
      // `;

      // await sentMailToAdmin(mailSubject,htmlBody)

      // ✅ ADMIN: seller pending verification
      await sendNewSellerAdminVerifyEmail({
        sellerName: seller.businessName,
        sellerEmail: seller.email,
      });

      console.log("✅ Seller verified successfully:", email);
      res.status(201).json({
        success: true,
        message: "Seller verified successfully!",
        seller,
      });
    } catch (error) {
      console.error("❌ Activation error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// login shop
router.post(
  "/login-shop",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(new ErrorHandler("Please provide the all fields!", 400));
      }

      const user = await Shop.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User doesn't exists!", 400));
      }

      if (!user.verified) {
        return next(new ErrorHandler("Shop is not verified", 401));
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }

      sendShopToken(user, 200, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// load shop
router.get(
  "/getSeller",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.seller._id);

      if (!seller) {
        return next(new ErrorHandler("User doesn't exists", 400));
      }

      res.status(200).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const isProd = process.env.NODE_ENV === "production";

      res.clearCookie("seller_token", {
        httpOnly: true,
        secure: isProd, // true in prod (HTTPS)
        sameSite: isProd ? "none" : "lax",
        path: "/", // MUST match login
      });

      res.status(200).json({
        success: true,
        message: "Log out successful!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get shop info
router.get(
  "/get-shop-info/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shop = await Shop.findById(req.params.id);
      res.status(201).json({
        success: true,
        shop,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update shop profile picture
router.put(
  "/update-shop-avatar",
  isSeller,
  uploadV2.single("image"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const existsUser = await Shop.findById(req.seller._id);

      const existAvatarPath = `uploads/images/${existsUser.avatar}`;

      fs.unlinkSync(existAvatarPath);

      const fileUrl = path.join(req.file.filename);

      const seller = await Shop.findByIdAndUpdate(req.seller._id, {
        avatar: fileUrl,
      });

      await addActivityLog({
        userId: seller._id,
        userType: "Shop",
        action: "Vendor Update",
        entityType: "Shop",
        entityId: seller._id,
        description: seller.businessName + " updated shop avatar to " + fileUrl,
        metaData: {
          avatar: {
            oldValue: existsUser.avatar,
            newValue: seller.avatar,
          },
        },
      });

      res.status(200).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update seller info (legacy duplicate-safe route)
router.put(
  "/update-seller-info",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const { name, description, address, phoneNumber, zipCode } = req.body;

    const shop = await Shop.findOne(req.seller._id);

    const fields = ["name", "description", "address", "phoneNumber", "zipCode"];
    const metaData = {};
    fields.forEach((f) => {
      if (shop[f] !== req.body[f]) {
        metaData[f] = {
          oldValue: shop[f],
          newValue: req.body[f],
        };
      }
    });

    if (!shop) {
      throw new ErrorHandler("User not found", 400);
    }
    shop.name = name;
    shop.description = description;
    shop.address = address;
    shop.phoneNumber = phoneNumber;
    shop.zipCode = zipCode;

    await shop.save();
    await addActivityLog({
      userId: shop._id,
      userType: "Shop",
      action: "Vendor Update",
      entityType: "Shop",
      entityId: shop._id,
      description: `${shop.businessName} updated shop profile information`,
      metaData: metaData,
    });

    res.status(201).json({
      success: true,
      shop,
    });
  })
);

// all sellers --- for admin
router.get(
  "/admin-all-sellers",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const sellers = await Shop.find().sort({
        createdAt: -1,
      });
      if (sellers.length === 0)
        return next(new ErrorHandler("No sellers", 404));

      res.status(200).json({
        success: true,
        sellers,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.get(
  "/admin-verified-sellers",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const sellers = await Shop.find({ verified: true }).sort({
        createdAt: -1,
      });
      if (sellers.length === 0) {
        return next(new ErrorHandler("No sellers", 404));
      }

      res.status(200).json({
        success: true,
        sellers,
      });
    } catch (error) {
      return next(new ErrorHandler("Something went wrong", 500));
    }
  })
);

//admin verifying seller
router.post(
  "/verify-seller/",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    const { sellerId } = req.body;
    try {
      const seller = await Shop.findById(sellerId);

      if (!seller) {
        return next(new ErrorHandler("Seller not found", 404));
      }
      seller.verified = true;
      await seller.save();
      await sendRegistrationCompleteSellerEmail({
        sellerEmail: seller.email,
        sellerName: seller.businessName,
      });

      await addActivityLog({
        userId: req.user._id,
        userType: "User",
        action: "Vendor Verify",
        entityType: "Shop",
        entityId: seller._id,
        description: "Admin verified seller " + seller.businessName,
      });
      res.status(201).json({ message: "seller is verified successfully" });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  })
);

// delete seller ---admin
router.delete(
  "/delete-seller/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.params.id);

      if (!seller) {
        return next(
          new ErrorHandler("Seller is not available with this id", 400)
        );
      }

      await Shop.findByIdAndDelete(req.params.id);
      await addActivityLog({
        userId: req.user._id,
        userType: "User",
        action: "Vendor Delete",
        entityType: "Shop",
        entityId: seller._id,
        description: "Admin deleted seller " + seller.businessName,
        metadata: {
          seller: {
            oldValue: seller,
            newValue: null,
          },
        },
      });

      res.status(201).json({
        success: true,
        message: "Seller deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update seller withdraw methods --- sellers
router.put(
  "/update-payment-methods",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { withdrawMethod } = req.body;

      const seller = await Shop.findByIdAndUpdate(req.seller._id, {
        withdrawMethod,
      });

      res.status(201).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete seller withdraw merthods --- only seller
router.delete(
  "/delete-withdraw-method/",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.seller._id);

      if (!seller) {
        return next(new ErrorHandler("Seller not found with this id", 400));
      }

      seller.withdrawMethod = null;

      await seller.save();

      res.status(201).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Express route
router.get(
  "/admin-seller/:id",
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    // Validate ObjectId
    const seller = await Shop.findById(id);

    if (!seller) {
      return next(new ErrorHandler("Seller not found", 404));
    }

    res.status(200).json({
      success: true,
      seller,
    });
  })
);
router.get(
  "/getSeller/:id",
  // only admins can fetch any seller by ID
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const sellerId = req.params.id;
      const seller = await Shop.findById(sellerId);

      if (!seller) {
        return next(new ErrorHandler("Seller not found", 404));
      }

      res.status(200).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Admin – download seller registration PDF
router.get(
  "/seller-registration-pdf/:sellerId",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    const { sellerId } = req.params;

    const seller = await Shop.findById(sellerId);
    if (!seller || !seller.registrationPdf) {
      return next(new ErrorHandler("Seller PDF not found", 404));
    }

    // registrationPdf may be 'pdfs/<file>.pdf' (URL path) or 'uploads/pdfs/<file>.pdf' (rare)
    let rel = seller.registrationPdf || "";

    // normalize and compute absolute path (support both formats)
    let absPath;
    if (rel.startsWith("uploads/")) {
      absPath = path.join(process.cwd(), rel); // already a relative FS path
    } else if (rel.startsWith("pdfs/")) {
      // stored as URL path 'pdfs/xxx.pdf' -> actual file is in uploads/pdfs/xxx.pdf
      absPath = path.join(process.cwd(), "uploads", rel);
    } else if (rel.includes("/pdfs/")) {
      // handle accidental 'something/pdfS/..'
      absPath = path.join(process.cwd(), rel.replace(/^\/+/, ""));
    } else {
      // fallback: assume filename only
      absPath = path.join(process.cwd(), "uploads", "pdfs", rel);
    }

    if (!fs.existsSync(absPath)) {
      console.error("Seller PDF missing on disk:", {
        sellerId,
        registrationPdf: rel,
        absPath,
      });
      return next(new ErrorHandler("PDF file missing on server", 404));
    }

    // send inline
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    return res.sendFile(absPath);
  })
);

module.exports = router;
