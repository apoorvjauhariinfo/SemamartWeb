// backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const Shop = require("../model/shop");
const User = require("../model/user");
const ErrorHandler = require("../utils/ErrorHandler");

// prefer admin 'token' cookie when present, fallback to seller_token
function extractToken(req) {
  // prefer generic token cookie first (admin / normal users)
  if (req.cookies && req.cookies.token) return req.cookies.token;

  // fallback to seller token (used for sellers)
  if (req.cookies && req.cookies.seller_token) return req.cookies.seller_token;

  // Authorization header fallback
  const auth = req.headers && req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    return auth.split(" ")[1];
  }

  return null;
}

async function tryFindUserById(id) {
  if (!id) return null;
  try {
    const user = await User.findById(id);
    if (user) return { type: "user", doc: user };
  } catch (e) {}
  try {
    const shop = await Shop.findById(id);
    if (shop) return { type: "shop", doc: shop };
  } catch (e) {}
  return null;
}

exports.isAuthenticated = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      console.warn("isAuthenticated: no token found");
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    // prefer server JWT secret; fallback to activation secret (kept for legacy)
    const secret = process.env.JWT_SECRET_KEY || process.env.ACTIVATION_SECRET;
    if (!secret) {
      console.error("isAuthenticated: missing JWT secret in env");
      return res.status(500).json({ success: false, message: "Server misconfiguration" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      console.warn("isAuthenticated: token verify failed:", err.message);
      return res.status(401).json({ success: false, message: "Authentication failed: invalid token" });
    }

    // decoded may have either id or _id (or nested)
    const id = decoded.id || decoded._id || (decoded.user && decoded.user.id) || (decoded.user && decoded.user._id);
    if (!id) {
      console.warn("isAuthenticated: token decoded but no id field", decoded);
      return res.status(401).json({ success: false, message: "Authentication failed: invalid token payload" });
    }

    const found = await tryFindUserById(id);
    if (!found) {
      console.warn("isAuthenticated: token valid but no user or shop found for id", id);
      return res.status(401).json({ success: false, message: "Token valid but user not found" });
    }

    if (found.type === "user") req.user = found.doc;
    else if (found.type === "shop") req.seller = found.doc;

    return next();
  } catch (err) {
    console.error("isAuthenticated unexpected error:", err);
    return res.status(401).json({ success: false, message: "Authentication failed" });
  }
};

exports.isSeller = async (req, res, next) => {
  try {
    if (req.seller) return next();
    const token = extractToken(req);
    if (!token) return res.status(401).json({ success: false, message: "Not authenticated (seller)" });

    const secret = process.env.JWT_SECRET_KEY || process.env.ACTIVATION_SECRET;
    let decoded;
    try { decoded = jwt.verify(token, secret); } catch (err) {
      console.warn("isSeller: token verify failed", err.message);
      return res.status(401).json({ success: false, message: "Seller authentication failed" });
    }

    const id = decoded.id || decoded._id;
    if (!id) return res.status(401).json({ success: false, message: "Seller authentication failed (no id)" });

    const seller = await Shop.findById(id).select("+password");
    if (!seller) return res.status(401).json({ success: false, message: "Seller not found" });

    req.seller = seller;
    next();
  } catch (err) {
    console.error("isSeller error:", err);
    return res.status(401).json({ success: false, message: "Seller authentication failed" });
  }
};

exports.isAdmin = (role = "Admin") => {
  return async (req, res, next) => {
    try {
      // if isAuthenticated didn't run earlier, run it now
      if (!req.user) {
        // call isAuthenticated inline
        const token = extractToken(req);
        if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });

        const secret = process.env.JWT_SECRET_KEY || process.env.ACTIVATION_SECRET;
        let decoded;
        try { decoded = jwt.verify(token, secret); } catch (err) {
          console.warn("isAdmin: token verify failed", err.message);
          return res.status(401).json({ success: false, message: "Authentication failed" });
        }
        const id = decoded.id || decoded._id;
        if (!id) return res.status(401).json({ success: false, message: "Authentication failed" });

        const user = await User.findById(id);
        if (!user) return res.status(401).json({ success: false, message: "User not found" });
        req.user = user;
      }

      if (req.user.role !== role) {
        console.warn("isAdmin: forbidden - user role:", req.user.role);
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      next();
    } catch (err) {
      console.error("isAdmin unexpected error:", err);
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
  };
};
