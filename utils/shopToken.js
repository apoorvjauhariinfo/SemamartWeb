// utils/sendShopToken.js
const jwt = require("jsonwebtoken");

module.exports = function sendShopToken(shop, statusCode, res) {
  const payload = { id: shop._id };
  const secret = process.env.JWT_SECRET_KEY || process.env.ACTIVATION_SECRET;
  const token = jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES || "7d",
  });

  // cookie options - dev friendly
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production", // only true on https
  };

  res.cookie("seller_token", token, cookieOptions);

  // also send token in JSON body so frontend can optionally store as bearer
  res.status(statusCode).json({
    success: true,
    seller: shop,
    token,
  });
};
