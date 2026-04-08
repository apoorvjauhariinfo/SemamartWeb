const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");

async function resolveAuthenticatedUser(userId) {
  const authUser = await User.findById(userId);
  if (!authUser) return null;

  if (
    authUser.accountType === "member" &&
    authUser.memberScope === "user" &&
    authUser.parentUser
  ) {
    const parentUser = await User.findById(authUser.parentUser);
    if (!parentUser) return null;

    parentUser._doc.memberContext = {
      memberId: authUser._id,
      memberScope: "user",
      isSubMember: true,
      permissions: authUser.permissions || {},
      email: authUser.email,
      firstName: authUser.firstName,
      lastName: authUser.lastName,
    };

    return {
      actingUser: authUser,
      effectiveUser: parentUser,
    };
  }

  if (
    authUser.role === "SellerMember" ||
    authUser.accountType === "seller-member"
  ) {
    authUser._doc.memberContext = {
      memberId: authUser._id,
      memberScope: "seller",
      isSubMember: true,
      permissions: authUser.permissions || {},
      email: authUser.email,
      firstName: authUser.firstName,
      lastName: authUser.lastName,
      shopId: authUser.shopId || null,
    };

    return {
      actingUser: authUser,
      effectiveUser: authUser,
    };
  }

  authUser._doc.memberContext = {
    memberId: authUser._id,
    memberScope: authUser.memberScope || null,
    isSubMember: authUser.accountType === "member",
    permissions: authUser.permissions || {},
    email: authUser.email,
    firstName: authUser.firstName,
    lastName: authUser.lastName,
  };

  return {
    actingUser: authUser,
    effectiveUser: authUser,
  };
}

async function resolveAuthenticatedSeller(sellerId) {
  const mainSeller = await Shop.findById(sellerId);
  if (mainSeller) {
    mainSeller._doc.memberContext = {
      memberId: mainSeller._id,
      memberScope: null,
      isSubMember: false,
      permissions: {},
    };

    return {
      actingSeller: mainSeller,
      effectiveSeller: mainSeller,
      authType: "seller-token",
    };
  }

  const sellerMember = await User.findById(sellerId);
  if (
    !sellerMember ||
    !(
      sellerMember.accountType === "member" ||
      sellerMember.role === "SellerMember" ||
      sellerMember.accountType === "seller-member"
    )
  ) {
    return null;
  }

  const parentSeller = await Shop.findById(
    sellerMember.parentSeller || sellerMember.shopId
  );
  if (!parentSeller) return null;

  parentSeller._doc.memberContext = {
    memberId: sellerMember._id,
    memberScope: "seller",
    isSubMember: true,
    permissions: sellerMember.permissions || {},
    email: sellerMember.email,
    firstName: sellerMember.firstName,
    lastName: sellerMember.lastName,
  };

  return {
    actingSeller: sellerMember,
    effectiveSeller: parentSeller,
    authType: "member",
  };
}

exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return next(new ErrorHandler("Please login to continue", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  const resolved = await resolveAuthenticatedUser(decoded.id);

  if (!resolved) {
    return next(new ErrorHandler("Please login to continue", 401));
  }

  req.authUser = resolved.actingUser;
  req.user = resolved.effectiveUser;
  next();
});

exports.isSeller = catchAsyncErrors(async (req, res, next) => {
  const { seller_token, token } = req.cookies;
  const cookieToken = seller_token || token;
  if (!cookieToken) {
    return next(new ErrorHandler("Please login as seller to continue", 401));
  }

  const decoded = jwt.verify(cookieToken, process.env.JWT_SECRET_KEY);
  const resolved = await resolveAuthenticatedSeller(decoded.id);

  if (!resolved) {
    return next(new ErrorHandler("Please login as seller to continue", 401));
  }

  req.authSeller = resolved.actingSeller;
  req.seller = resolved.effectiveSeller;
  req.sellerAuthSource = resolved.authType || "seller-token";
  req.sellerMember = resolved.authType === "member" ? resolved.actingSeller : null;
  if (resolved.authType === "member") {
    req.user = resolved.actingSeller;
  }
  next();
});

exports.isAdmin = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(`${req.user.role} can not access this resources!`)
      );
    }
    next();
  };
};

exports.hasPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { role, permissions = {} } = req.user;
    if (role === "Admin") return next();

    const allowed = requiredPermissions.some((perm) => permissions[perm] === true);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: `${role} is not allowed to access this resource`,
      });
    }

    next();
  };
};

exports.hasSellerPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.seller) {
      return res.status(401).json({
        success: false,
        message: "Seller authentication required",
      });
    }

    if (req.sellerAuthSource !== "member") {
      return next();
    }

    const permissions = req.user?.permissions || {};
    const allowed = requiredPermissions.some((perm) => permissions[perm] === true);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this seller action",
      });
    }

    next();
  };
};
