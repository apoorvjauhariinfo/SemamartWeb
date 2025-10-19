const express = require("express");
const path = require("path");
const User = require("../model/user");
const { upload } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/create-user", upload.none(), async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      phoneNumber,
      email,
      instituteName,
      password,
    } = req.body;

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
      addresses: req.body.addresses.map((addr) => ({
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

    // ✅ Send activation email via Mailjet
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
        <h2>Welcome to Semamart!</h2>
        <p>Hello ${firstName || "User"},</p>
        <p>Thank you for registering with Semamart.</p>
        <p>Please click the link below to activate your account:</p>
        <a href="${activationUrl}" 
           style="display:inline-block;padding:10px 15px;background:#007bff;color:#fff;text-decoration:none;border-radius:5px;">
          Activate Account
        </a>
        <p style="margin-top:15px;">This link will expire in 15 minutes.</p>
        <hr/>
        <p>If you didn’t create this account, you can ignore this email.</p>
      </div>
    `;

    try {
      await sendMail({
        email: user.email,
        subject: "Activate your Semamart account",
        html,
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
        process.env.ACTIVATION_SECRET,
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

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }),
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
        return next(
          new ErrorHandler("Please provide the correct inforamtions", 400),
        );
      }
      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }),
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
  }),
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
  }),
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
          new ErrorHandler("Please provide the correct information", 400),
        );
      }

      user.name = name;
      user.email = email;
      user.phoneNumber = phoneNumber;

      await user.save();

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }),
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
        { new: true },
      );

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }),
);

// update user addresses
router.put(
  "/update-user-addresses",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      const sameTypeAddress = user.addresses.find(
        (address) => address.addressType === req.body.addressType,
      );
      if (sameTypeAddress) {
        return next(
          new ErrorHandler(`${req.body.addressType} address already exists`),
        );
      }

      const existsAddress = user.addresses.find(
        (address) => address._id === req.body._id,
      );

      if (existsAddress) {
        Object.assign(existsAddress, req.body);
      } else {
        // add the new address to the array
        user.addresses.push(req.body);
      }

      await user.save();

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }),
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
        { $pull: { addresses: { _id: addressId } } },
      );

      const user = await User.findById(userId);

      res.status(200).json({ success: true, user });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }),
);

// update user password
router.put(
  "/update-user-password",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select("+password");

      const isPasswordMatched = await user.comparePassword(
        req.body.oldPassword,
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
          new ErrorHandler("Password doesn't matched with each other!", 400),
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
  }),
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
  }),
);

// all users --- for admin
router.get(
  "/admin-all-users",
  // isAuthenticated,
  //isAdmin("Admin"),
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
  }),
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
          new ErrorHandler("User is not available with this id", 400),
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
  }),
);

router.post('/:userId/addresses', async (req, res) => {
  try {
    const { userId } = req.params;
    const newAddress = req.body;

    // Basic validation for required fields
    const requiredFields = ['phone', 'reciever_name', 'state', 'district', 'instituteAddress1', 'pincode', 'addressType'];
    for (const field of requiredFields) {
      if (!newAddress[field]) {
        return res.status(400).json({ success: false, message: `${field} is required` });
      }
    }

    // Validate addressType enum
    const allowedAddressTypes = ['Home', 'Work'];
    if (!allowedAddressTypes.includes(newAddress.addressType)) {
      return res.status(400).json({ success: false, message: `addressType must be one of ${allowedAddressTypes.join(', ')}` });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



// Update address by address id
router.put('/:userId/addresses/:addressId', async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const updatedAddressData = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');

    const address = user.addresses.id(addressId);
    if (!address) return res.status(404).send('Address not found');

    Object.assign(address, updatedAddressData);
    await user.save();

    res.json(address);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete address by address id
router.delete('/:userId/addresses/:addressId', async (req, res) => {
  try {
    const { userId, addressId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');

    // Find index of the address to remove
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) return res.status(404).send('Address not found');

    // Remove address from array
    user.addresses.splice(addressIndex, 1);

    // Save the user
    await user.save();

    res.json({ message: 'Address deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/:userId/addresses', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user.addresses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
