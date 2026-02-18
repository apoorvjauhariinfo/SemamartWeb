// routes/user.js  (drop-in replacement)
const express = require("express");
const path = require("path");
const User = require("../model/user");
const Role = require("../model/role");
const { upload } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const { isAuthenticated, isAdmin, hasPermission} = require("../middleware/auth");
const crypto = require("crypto"); // <-- added for reset token generation
const mongoose = require("mongoose");
const Order = require("../model/order"); // adjust path as needed
const { Product, ProductVariant } = require("../model/product");
const sentMailToAdmin = require("../utils/mailToAdmin");
const generateUserPdf = require("../utils/generateUserPdf"); // moved here so PDF can be generated at registration
const sendSelfVerifyCustomerEmail = require("../utils/emails/selfVerifyCustomer");
const sendRegistrationCompleteCustomerEmail = require("../utils/emails/registrationCompleteCustomer");
const sendNewInstituteRegisteredAdminEmail = require("../utils/emails/newInstituteRegisteredAdmin");
const { uploadV2 } = require("../multer");
const router = express.Router();
const Review = require("../model/review");


// --- add this helper after your imports (generateUserPdf is already imported) ---
/**
 * Regenerate registration PDF for a given mongoose user document.
 * Updates user.registrationPdf and saves the user if generation succeeds.
 * Errors are swallowed (logged) so they don't block the HTTP response.
 */
async function regenerateUserRegistrationPdf(user) {
  try {
    if (!user || !user._id) return null;
    // Ensure we have a mongoose document
    // if user is a plain object, try to fetch fresh doc
    let doc = user;
    if (!user.save || typeof user.save !== "function") {
      doc = await User.findById(user._id);
      if (!doc) return null;
    }

    const relPath = await generateUserPdf(doc); // expected to return something like 'pdfs/<id>.pdf'
    if (relPath) {
      doc.registrationPdf = relPath;
      await doc.save();
      console.log("✅ User registration PDF regenerated:", doc._id, relPath);
      return relPath;
    }
    console.warn("⚠️ generateUserPdf returned falsy for user:", doc._id);
    return null;
  } catch (err) {
    console.error("⚠️ Failed to regenerate registration PDF for user:", user && user._id, err);
    return null;
  }
}


router.post("/create-user", upload.none(), async (req, res, next) => {
  try {
    const { firstName, lastName, phoneNumber, email, instituteName, password, gstNumber } =
      req.body;

    const userEmail = await User.findOne({ email });
    if (userEmail) {
      return next(new ErrorHandler("User already exists", 400));
    }

    const userTokenData = { email };
    const activationToken = createActivationToken(userTokenData);

    // With this cleaner one:
    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const activationUrl = `${frontendBaseUrl}/user/activation/${activationToken}`;

    // ✅ Create new user document
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      instituteName,
      gstNumber,
      addresses: (req.body.addresses || []).map((addr) => ({
        reciever_name: addr.reciever_name,
        instituteAddress1: addr.instituteAddress1,
        instituteAddress2: addr.instituteAddress2 || "",
        landmark: addr.landmark || "",
        pincode: addr.pincode,
        district: addr.district,
        state: addr.state,
        phone: addr.phone,
        alternatePhone: addr.alternatePhone || "",
        addressType: addr.addressType || "Home",
      })),
    });

    // ---------- GENERATE REGISTRATION PDF FOR USER IMMEDIATELY ----------
    try {
      const relPdfPath = await generateUserPdf(user); // expected to return 'uploads/pdfs/<userId>.pdf' or similar
      if (relPdfPath) {
        user.registrationPdf = relPdfPath;
        await user.save();
        console.log(
          "✅ User registration PDF created at registration:",
          relPdfPath
        );
      } else {
        console.warn(
          "⚠️ generateUserPdf returned falsy value for user:",
          user._id
        );
      }
    } catch (pdfErr) {
      // Log but do not block user creation or activation email
      console.error(
        "⚠️ User PDF generation failed at registration for",
        user._id,
        pdfErr
      );
    }
    // ---------- END PDF GENERATION ----------

    // ✅ Send activation email via Mailjet
    // const html = `
    //   <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
    //     <h2>Welcome to Semamart!</h2>
    //     <p>Hello ${firstName || "User"},</p>
    //     <p>Thank you for registering with Semamart.</p>
    //     <p>Please click the link below to activate your account:</p>
    //     <a href="${activationUrl}"
    //        style="display:inline-block;padding:10px 15px;background:#007bff;color:#fff;text-decoration:none;border-radius:5px;">
    //       Activate Account
    //     </a>
    //     <p style="margin-top:15px;">This link will expire in 15 minutes.</p>
    //     <hr/>
    //     <p>If you didn’t create this account, you can ignore this email.</p>
    //   </div>
    // `;

    try {
      await sendSelfVerifyCustomerEmail({
        customerEmail: user.email,
        customerName: user.firstName,
        verificationToken: activationToken,
      });

      console.log("✅ Activation email sent successfully to:", user.email);

      res.status(201).json({
        success: true,
        message: `Please check your email (${user.email}) to activate your account.`,
      });
    } catch (emailErr) {
      console.error("❌ Failed to send activation email:", emailErr.message);
      return next(new ErrorHandler("Failed to send activation email.", 500));
    }
  } catch (err) {
    console.error("❌ Error during registration:", err.message);
    return next(new ErrorHandler(err.message, 400));
  }
});

// create activation token
const createActivationToken = (user) => {
  // why use create activatetoken?
  // to create a token for the user to activate their account  after they register
  return jwt.sign(user, process.env.ACTIVATION_SECRET, {
    expiresIn: "15m",
  });
};

// activate user account
router.post(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { activation_token } = req.body;

      const newUser = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET
      );
      if (!newUser) {
        return next(new ErrorHandler("Invalid token", 400));
      }
      const { email } = newUser;

      let user = await User.findOne({ email });

      if (user && user.isVerified) {
        return next(new ErrorHandler("User already exists", 400));
      }

      user.isVerified = true;
      await user.save();

      // NOTE: PDF generation moved to registration time to ensure PDF exists even if user doesn't verify.
      // send token & mail to admin
      sendToken(user, 201, res);

      // ✅ CUSTOMER: registration completed
      await sendRegistrationCompleteCustomerEmail({
        customerEmail: user.email,
        customerName: user.firstName,
      });

      // ✅ ADMIN: new institute registered
      await sendNewInstituteRegisteredAdminEmail({
        instituteName: user.instituteName,
        instituteEmail: user.email,
        institutePhone: user.phoneNumber,
      });

      // const mailSubject = "New User registered";
      // const htmlBody = `
      //   <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
      //     <h2 style="color: #2c3e50;">New User Registration</h2>
      //     <p>A new user has just registered on the platform.</p>
      //     <div style="margin-top: 20px; padding: 15px; background: #f7f7f7; border-left: 4px solid #3498db;">
      //       <p style="margin: 0;"><strong>User's name:</strong> ${user.firstName} ${user.lastName}</p>
      //       <p style="margin: 0;"><strong>Email:</strong> ${user.email}</p>
      //       <p style="margin: 0;"><strong>Registration Date:</strong> ${new Date(user.createdAt).toLocaleDateString("en-IN")}</p>
      //     </div>
      //   </div>
      // `;
      // await sentMailToAdmin(mailSubject, htmlBody);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// login user
router.post(
  "/login-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(new ErrorHandler("Please provide the all filelds", 400));
      }
      const user = await User.findOne({ email }).select("+password");
      // +password is used to select the password field from the database

      if (!user) {
        return next(new ErrorHandler("User doesn't exist", 400));
      }
      
      if (!user.isVerified)
        return next(new ErrorHandler("Account not verified", 401));

      // compore password with database password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(new ErrorHandler("User Details Mismatched", 400));
      }
      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// load user
router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return next(new ErrorHandler("User doesn't exists", 400));
      }
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.get(
  "/getmemberuser",
  
  catchAsyncErrors(async (req, res, next) => {
    try {
      const users = await User.find({
        role: { $nin: ["user", "seller", "Admin"] }
      });

      if (!users || users.length === 0) {
        return next(new ErrorHandler("No staff users found", 404));
      }

      res.status(200).json({
        success: true,
        count: users.length,
        users,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.post(
  "/create-role",
  catchAsyncErrors(async (req, res, next) => {
    const { name } = req.body;

    if (!name) {
      return next(new ErrorHandler("Role name is required", 400));
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ name });

    if (existingRole) {
      return next(new ErrorHandler("Role already exists", 400));
    }

    const role = await Role.create({ name });

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      role,
    });
  })
);


// log out user
router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
      });
      res.status(201).json({
        success: true,
        message: "Log out successful!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


// update user info
router.put(
  "/update-user-info",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password, phoneNumber, name } = req.body;

      /* The line `const user = await User.findOne({ email }).select("+password");` is querying the database
to find a user with the specified email address. The `select("+password")` part is used to include
the password field in the returned user object. By default, the password field is not selected when
querying the database for security reasons. However, in this case, the password field is needed to
compare the provided password with the stored password for authentication purposes. */
      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }

      user.name = name;
      user.email = email;
      user.phoneNumber = phoneNumber;

      await user.save();

       // Regenerate registration PDF so we have latest info
      await regenerateUserRegistrationPdf(user);
       
      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// NEW: partial profile update (no password required) - recommended for ProfileForm
router.patch(
  "/update-profile",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      // Only allow specific fields
      const allowed = [
        "firstName",
        "lastName",
        "email",
        "phoneNumber",
        "instituteName",
        "name",
      ];
      const updates = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true }
      );

      if (!user) return next(new ErrorHandler("User not found", 404));

       // Regenerate registration PDF so we have latest info
      await regenerateUserRegistrationPdf(user);

      res.status(200).json({ success: true, user });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user avatar
router.put(
  "/update-avatar",
  isAuthenticated,
  upload.single("image"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const existsUser = await User.findById(req.user.id);

      const existAvatarPath = `uploads/${existsUser.avatar}`;

      if (fs.existsSync(existAvatarPath)) {
        fs.unlinkSync(existAvatarPath); // Delete Priviuse Image
      }

      const fileUrl = path.join(req.file.filename); // new image

      /* The code `const user = await User.findByIdAndUpdate(req.user.id, { avatar: fileUrl });` is
        updating the avatar field of the user with the specified `req.user.id`. It uses the
        `User.findByIdAndUpdate()` method to find the user by their id and update the avatar field
        with the new `fileUrl` value. The updated user object is then stored in the `user` variable. */
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          avatar: fileUrl,
        },
        { new: true }
      );

       // Regenerate registration PDF so we have latest info
      await regenerateUserRegistrationPdf(user);

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user addresses
router.put(
  "/update-user-addresses",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      const sameTypeAddress = user.addresses.find(
        (address) => address.addressType === req.body.addressType
      );
      if (sameTypeAddress) {
        return next(
          new ErrorHandler(`${req.body.addressType} address already exists`)
        );
      }

      const existsAddress = user.addresses.find(
        (address) => address._id === req.body._id
      );

      if (existsAddress) {
        Object.assign(existsAddress, req.body);
      } else {
        // add the new address to the array
        user.addresses.push(req.body);
      }

      await user.save();

       // Regenerate registration PDF so we have latest info
      await regenerateUserRegistrationPdf(user);
       
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete user address
router.delete(
  "/delete-user-address/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const userId = req.user._id;
      const addressId = req.params.id;

      //   console.log(addressId);

      await User.updateOne(
        {
          _id: userId,
        },
        { $pull: { addresses: { _id: addressId } } }
      );

      const user = await User.findById(userId);

       // Regenerate registration PDF so we have latest info
      await regenerateUserRegistrationPdf(user);

      res.status(200).json({ success: true, user });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user password
router.put(
  "/update-user-password",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select("+password");

      const isPasswordMatched = await user.comparePassword(
        req.body.oldPassword
      );

      if (!isPasswordMatched) {
        return next(new ErrorHandler("Old password is incorrect!", 400));
      }

      /* The line `if (req.body.newPassword !== req.body.confirmPassword)` is checking if the value of
    `newPassword` in the request body is not equal to the value of `confirmPassword` in the request
    body. This is used to ensure that the new password entered by the user matches the confirmation
    password entered by the user. If the two values do not match, it means that the user has entered
    different passwords and an error is returned. */
      if (req.body.newPassword !== req.body.confirmPassword) {
        return next(
          new ErrorHandler("Password doesn't matched with each other!", 400)
        );
      }
      user.password = req.body.newPassword;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Password updated successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Forgot password - send reset email
router.post(
  "/forgot-password",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email) return next(new ErrorHandler("Email is required", 400));

      const user = await User.findOne({ email });
      // Always respond with success message to avoid email enumeration
      if (!user) {
        return res.status(200).json({
          success: true,
          message:
            "If an account with this email exists, a reset link has been sent.",
        });
      }

      // create reset token (plain token to send by email)
      const resetToken = crypto.randomBytes(20).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // set token and expiry on user
      user.resetPasswordToken = hashedToken;
      user.resetPasswordTime = Date.now() + 60 * 60 * 1000; // 1 hour
      await user.save({ validateBeforeSave: false });

      // prepare reset URL
      const frontendBaseUrl =
        process.env.FRONTEND_URL || "http://localhost:5173";
      const resetUrl = `${frontendBaseUrl}/auth/reset-password/${resetToken}`;

      const messageHtml = `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
          <h3>Reset your password</h3>
          <p>If you requested a password reset, click the button below to set a new password. If you didn't request this, please ignore this email.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 15px;background:#007bff;color:#fff;text-decoration:none;border-radius:5px;">
            Reset Password
          </a>
          <p style="margin-top:10px">This link will expire in 1 hour.</p>
        </div>
      `;

      try {
        await sendMail({
          email: user.email,
          subject: "Semamart Password Reset",
          html: messageHtml,
        });
      } catch (emailErr) {
        // cleanup tokens on failure
        user.resetPasswordToken = undefined;
        user.resetPasswordTime = undefined;
        await user.save({ validateBeforeSave: false });
        console.error("Failed to send reset email:", emailErr.message);
        return next(new ErrorHandler("Failed to send reset email", 500));
      }

      return res.status(200).json({
        success: true,
        message:
          "If an account with this email exists, a reset link has been sent.",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Reset password using token
router.post(
  "/reset-password",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return next(
          new ErrorHandler("Token and newPassword are required", 400)
        );
      }

      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordTime: { $gt: Date.now() },
      }).select("+password");

      if (!user) {
        return next(new ErrorHandler("Invalid or expired token", 400));
      }

      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordTime = undefined;

      await user.save();

      return res.status(200).json({
        success: true,
        message: "Password reset successful",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// find user infoormation with the userId
router.get(
  "/user-info/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.post("/registerStaff",  async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, permissions } = req.body;

    // 1️⃣ Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // 2️⃣ Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered!" });
    }

    // 3️⃣ Create new user
    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role,
      permissions: permissions || {},
      isVerified: true, // optional
    });

    // 4️⃣ Save user
    await newUser.save(); // password hashed automatically

    // 5️⃣ Send response
    res.status(201).json({
      message: `${role} registered successfully!`,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        permissions: newUser.permissions,
      },
    });

  } catch (error) {
    console.error("Error registering staff:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// ===================== EDIT STAFF =====================
router.put("/updateStaff/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, lastName, email, role, permissions } = req.body;

    // 1️⃣ Validate required fields
    if (!firstName || !lastName || !email || !role || !permissions) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // 2️⃣ Find user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found!" });

    // 3️⃣ Update user fields exactly as sent
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email.toLowerCase();
    user.role = role;
    user.permissions = permissions; // use exactly what came from frontend

    // 4️⃣ Save changes
    await user.save();

    // 5️⃣ Return updated user
    res.status(200).json({
      message: "User updated successfully!",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.get(
  "/get-roles",
  catchAsyncErrors(async (req, res, next) => {
    const roles = await Role.find().sort({ name: 1 }); // A-Z sorting

    if (!roles || roles.length === 0) {
      return next(new ErrorHandler("No roles found", 404));
    }

    res.status(200).json({
      success: true,
      count: roles.length,
      roles,
    });
  })
);


// all users --- for admin
router.get(
  "/admin-all-users",
  isAuthenticated,
  hasPermission("AllInstitutes"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const users = await User.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        users,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete users --- admin
router.delete(
  "/delete-user/:id",
  // isAuthenticated,
  //isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return next(
          new ErrorHandler("User is not available with this id", 400)
        );
      }

      await User.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "User deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.post("/:userId/addresses", async (req, res) => {
  try {
    const { userId } = req.params;
    const newAddress = req.body;

    // Basic validation for required fields
    const requiredFields = [
      "phone",
      "reciever_name",
      "state",
      "district",
      "instituteAddress1",
      "pincode",
      "addressType",
    ];
    for (const field of requiredFields) {
      if (!newAddress[field]) {
        return res
          .status(400)
          .json({ success: false, message: `${field} is required` });
      }
    }

    // Validate addressType enum
    const allowedAddressTypes = ["Home", "Work"];
    if (!allowedAddressTypes.includes(newAddress.addressType)) {
      return res.status(400).json({
        success: false,
        message: `addressType must be one of ${allowedAddressTypes.join(", ")}`,
      });
    }

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update address by address id
router.put("/:userId/addresses/:addressId", async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const updatedAddressData = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).send("User not found");

    const address = user.addresses.id(addressId);
    if (!address) return res.status(404).send("Address not found");

    Object.assign(address, updatedAddressData);
    await user.save();

    res.json(address);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete address by address id
router.delete("/:userId/addresses/:addressId", async (req, res) => {
  try {
    const { userId, addressId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).send("User not found");

    // Find index of the address to remove
    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );
    if (addressIndex === -1) return res.status(404).send("Address not found");

    // Remove address from array
    user.addresses.splice(addressIndex, 1);

    // Save the user
    await user.save();

    res.json({ message: "Address deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:userId/addresses", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.addresses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:userId/products", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid userId" });
    }

    const products = await Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $unwind: "$variant" },
      {
        $lookup: {
          from: "productvariants",
          localField: "variant",
          foreignField: "_id",
          as: "variantDetails",
        },
      },
      { $unwind: "$variantDetails" },
      {
        $lookup: {
          from: "products",
          localField: "variantDetails.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      // Include everything from Order, Variant, Product
      {
        $addFields: {
          variantDetails: "$variantDetails",
          productDetails: "$productDetails",
        },
      },
      { $sort: { createdAt: -1 } }, // sort by order date
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (err) {
    console.error("Error fetching user products:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.get(
  "/getUser/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId);

      if (!user) {
        return next(new ErrorHandler("user not found", 404));
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Admin – download user registration PDF
router.get(
  "/user-registration-pdf/:userId",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user || !user.registrationPdf) {
      return next(new ErrorHandler("User PDF not found", 404));
    }

    // registrationPdf might be:
    // - "pdfs/<id>.pdf"   (public URL path)
    // - "uploads/pdfs/<id>.pdf" (filesystem relative path)
    let rel = user.registrationPdf;

    let absPath;
    if (rel.startsWith("uploads/")) {
      absPath = path.join(process.cwd(), rel);
    } else if (rel.startsWith("pdfs/")) {
      absPath = path.join(process.cwd(), "uploads", rel);
    } else {
      // fallback (filename only or unexpected format)
      absPath = path.join(process.cwd(), "uploads", "pdfs", rel);
    }

    if (!fs.existsSync(absPath)) {
      console.error("❌ User PDF missing on disk:", {
        userId,
        storedPath: rel,
        resolvedPath: absPath,
      });
      return next(new ErrorHandler("PDF file missing on server", 404));
    }

    // Open inline in browser
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");

    return res.sendFile(absPath);
  })
);

router.post("/addReview", uploadV2.array("images", 5), async (req, res) => {
  try {
    const { productId, rating, comment,user, orderId } = req.body;
     

    if (!productId || !rating || !orderId) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID, Order ID, and rating are required" });
    }

     const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Optional: Prevent duplicate review for the same order
    if (order.review) {
      return res.status(400).json({ success: false, message: "This order already has a review" });
    }

    const images = (req.files || []).map(f => f.filename);

    const review = await Review.create({
      user,
      productId,
      orderId,
      rating,
      comment: comment || "",
      images,
    });
    await Order.findByIdAndUpdate(orderId, { review: review._id });
    order.review = review._id;
    await order.save();
    await Product.findByIdAndUpdate(productId, { $push: { reviews: review._id } });

    res.json({ success: true, review });
  } catch (err) {
    console.error("Add review error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update review route
router.put(
  "/updateReview/:reviewId",
  uploadV2.array("images", 5), // max 5 images
  async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { rating, comment, existingImages } = req.body; // <-- get existingImages

      if (!reviewId) {
        return res
          .status(400)
          .json({ success: false, message: "Review ID is required" });
      }

      // Find existing review
      const review = await Review.findById(reviewId);
      if (!review) {
        return res
          .status(404)
          .json({ success: false, message: "Review not found" });
      }

      // Update rating & comment if provided
      if (rating) review.rating = rating;
      if (comment !== undefined) review.comment = comment;

      // Start with images the user wants to keep
      let updatedImages = [];
      if (existingImages) {
        // Parse JSON string from frontend
        updatedImages = JSON.parse(existingImages);
      }

      // Add any newly uploaded images
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map((f) => f.filename);
        updatedImages = [...updatedImages, ...newImages];
      }

      review.images = updatedImages; // overwrite old images with updated list

      await review.save();

      res.json({ success: true, review });
    } catch (err) {
      console.error("Update review error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);





module.exports = router;
