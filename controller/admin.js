const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

const Order = require("../model/order");
const Shop = require("../model/shop");
const User = require("../model/user");
const { isAuthenticated, isAdmin } = require("../middleware/auth");



router.get(
  "/admin-dashboard-summary",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const now = new Date();
      const year = now.getFullYear();

      // Helper to get start and end of month
      function getMonthDateRange(year, monthIndex) {
        const start = new Date(year, monthIndex, 1);
        const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
        return { start, end };
      }

      // Calculate start/end dates for current and last month
      const startOfThisMonth = new Date(year, now.getMonth(), 1);
      const startOfLastMonth = new Date(year, now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(year, now.getMonth(), 0, 23, 59, 59, 999);

      // --- Vendors ---
      const newVendorsCount = await Shop.countDocuments({
          verified: false,
        // createdAt: { $gte: startOfThisMonth },
      });

      const lastMonthVendorsCount = await Shop.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      });

      let vendorTrend = 0;
      if (lastMonthVendorsCount > 0) {
        vendorTrend =
          ((newVendorsCount - lastMonthVendorsCount) / lastMonthVendorsCount) * 100;
      } else if (newVendorsCount > 0) {
        vendorTrend = 100;
      }

      const totalVendorsCount = await Shop.countDocuments({
  verified: true,
});


      // --- Institutes (Users) ---
      const newInstitutesCount = await User.countDocuments({
        role: "user",
        // createdAt: { $gte: startOfThisMonth },
      });

      const lastMonthInstitutesCount = await User.countDocuments({
        // createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      });

      let instituteTrend = 0;
      if (lastMonthInstitutesCount > 0) {
        instituteTrend =
          ((newInstitutesCount - lastMonthInstitutesCount) / lastMonthInstitutesCount) * 100;
      } else if (newInstitutesCount > 0) {
        instituteTrend = 100;
      }

      const totalInstitutesCount = await User.countDocuments({
        role: "user",
      });

      // --- Orders ---
      const newOrdersCount = await Order.countDocuments({
      
      });

      const lastMonthOrdersCount = await Order.countDocuments({
      });

      let orderTrend = 0;
      if (lastMonthOrdersCount > 0) {
        orderTrend =
          ((newOrdersCount - lastMonthOrdersCount) / lastMonthOrdersCount) * 100;
      } else if (newOrdersCount > 0) {
        orderTrend = 100;
      }

      const totalOrdersCount = await Order.countDocuments();

      // Aggregate monthly orders count for the last 12 months (including this month)
      const monthsToFetch = 12;
      const monthlyOrders = [];

      for (let i = monthsToFetch - 1; i >= 0; i--) {
        const { start, end } = getMonthDateRange(year, now.getMonth() - i);
        const count = await Order.countDocuments({
          createdAt: { $gte: start, $lte: end },
        });
        const monthName = start.toLocaleString("default", { month: "short" });
        monthlyOrders.push({ month: monthName, orders: count });
      }

      res.status(200).json({
        success: true,
        data: {
          newVendors: newVendorsCount,
          vendors: totalVendorsCount,
          vendorTrend: vendorTrend.toFixed(1),

          newInstitutes: newInstitutesCount,
          institutes: totalInstitutesCount,
          instituteTrend: instituteTrend.toFixed(1),

          newOrders: newOrdersCount,
          orders: totalOrdersCount,
          orderTrend: orderTrend.toFixed(1),

          monthlyOrders,
        },
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// routes/admin.js
router.post("/logout", (req, res) => {
  const isProd = process.env.NODE_ENV === "production";

  res.clearCookie("token", {   // ⚠️ MUST MATCH LOGIN COOKIE NAME
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });

  res.status(200).json({ success: true });
});




module.exports = router;
