const express = require("express");

const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}
// connect db
const connectDatabase = require("./db/Database");
const ErrorHandler = require("./middleware/error");
const app = express();
connectDatabase();

// create server
const server = app.listen(8000, () => {
  console.log(`Server is running on http://localhost:${8000}`);
});

const uploadPath = path.join(__dirname, "uploads");


if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath + "/images", { recursive: true });
  fs.mkdirSync(uploadPath + "/videos", { recursive: true });
  fs.mkdirSync(uploadPath + "/docs", { recursive: true });
}

const paymentDocUploadPath = path.join(__dirname, "uploads/payment-docs")
if (!fs.existsSync(paymentDocUploadPath)) {
  fs.mkdirSync(paymentDocUploadPath + "/payment-docs", { recursive: true })
}

// middlewares
app.use(express.json());
app.use(cookieParser());
// Enable CORS for all routes

const allowedOriginsCors = [
  "http://localhost:5173",
  "http://test.semamart.com",
  "https://test.semamart.com",
  "https://semamart.com",
  "http://semamart.com",
  "https://www.semamart.com",
  "http://www.semamart.com",
    "https://www.beta.semamart.com",
  "http://www.beta.semamart.com",
    "https://beta.semamart.com",
  "http://beta.semamart.com",
  "https://smartgateway.hdfcuat.bank.in",
  "https://smartgateway.hdfcbank.com",
  "https://docs.hdfcbank.juspay.in",
  "https://dashboard.smartgateway.hdfcuat.bank.in",
];

app.use(
  cors({
    origin: function (origin, callback) {
      const hdfcOrigin =
        typeof origin === "string" &&
        (origin.includes("hdfcuat.bank.in") ||
          origin.includes("hdfcbank.com") ||
          origin.includes("hdfc.bank.in"));

      if (!origin || allowedOriginsCors.includes(origin) || hdfcOrigin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use("/", express.static("uploads"));

app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// why bodyparser?
// bodyparser is used to parse the data from the body of the request to the server (POST, PUT, DELETE, etc.)

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

app.get("/test", (req, res) => {
  res.send("Hello World!");
});
 
// routes
const user = require("./controller/user");
const admin = require("./controller/admin");

const shop = require("./controller/shop");
const product = require("./controller/product");
const event = require("./controller/event");
const coupon = require("./controller/coupounCode");
const payment = require("./controller/payment");
const order = require("./controller/order");
const message = require("./controller/message");
const conversation = require("./controller/conversation");
const withdraw = require("./controller/withdraw");
const category = require("./controller/category");
const subCategory = require("./controller/subcategory");
const specialPackageRoutes = require("./controller/specialityPackage");
const productVariant = require("./controller/productVariant");
const manufacturer = require("./controller/manufacturer");
const adminsummary = require("./controller/admin");
const hero = require("./controller/hero");
const sectionbanner = require("./controller/sectionbanner");
const cart = require("./controller/usercart");
const wishlist = require("./controller/userWishlist");
const bulkOrder = require("./controller/bulkOrder");
const notifyRequest = require("./controller/notifyRequest");
const emailTestRoutes = require("./controller/emailTest");
const review = require("./controller/review");


// end points
app.use("/api/v2/withdraw", withdraw);
app.use("/api/v2/user", user);
app.use("/api/v2/admin", admin);
app.use("/api/v2/conversation", conversation);
app.use("/api/v2/message", message);
app.use("/api/v2/order", order);
app.use("/api/v2/shop", shop);
app.use("/api/v2/product", product);
app.use("/api/v2/event", event);
app.use("/api/v2/coupon", coupon);
app.use("/api/v2/payment", payment);
app.use("/api/v2/category", category);
app.use("/api/v2/sub-category", subCategory);
app.use("/api/v2/special-package", specialPackageRoutes);
app.use("/api/v2/product-variant", productVariant);
app.use("/api/v2/manufacturer", manufacturer);
app.use("/api/v2/adminsummary", adminsummary);
app.use("/api/v2/cart", cart);
app.use("/api/v2/heroslider", hero);
app.use("/api/v2/sectionbanner", sectionbanner);
app.use("/api/v2/wishlist", wishlist);
app.use("/api/v2/bulkorder", bulkOrder)
app.use("/api/v2/notifyRequest", notifyRequest)
app.use("/api/v2/email-test", emailTestRoutes);
app.use("/api/v2/review", review);



// it'for errhendel
app.use(ErrorHandler);

// Handling Uncaught Exceptions
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`shutting down the server for handling UNCAUGHT EXCEPTION! 💥`);
});

// unhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Shutting down the server for ${err.message}`);
  console.log(`shutting down the server for unhandle promise rejection`);

  server.close(() => {
    process.exit(1);
  });
});
