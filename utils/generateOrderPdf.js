// backend/utils/generateOrderPdf.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let currencySymbol = "Rs."; // fallback

function fmtDate(d) {
  try {
    return new Date(d).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) { return ""; }
}
function formatCurrency(n) {
  if (n == null || Number.isNaN(Number(n))) return `${currencySymbol}0.00`;
  return currencySymbol + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getPngDimensions(filePath) {
  try {
    const fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(24);
    fs.readSync(fd, buffer, 0, 24, 0);
    fs.closeSync(fd);

    // PNG signature check
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47;
    if (!isPng) return null;

    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  } catch (e) {
    return null;
  }
}

function isUsableLogo(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;
    const dims = getPngDimensions(filePath);
    // Guard against ultra-wide/high-res PNGs that bloat PDF size.
    if (dims && (dims.width > 6000 || dims.height > 6000)) return false;
    return true;
  } catch (e) {
    return false;
  }
}

function getInvoiceLogoPath() {
  const logoNames = ["Logo-imag.png", "logo-comp-small.png", "logo-comp.png", "logo.png"];
  const logoDirs = [
    path.join(process.cwd(), "assets"),
    path.join(process.cwd(), "backend", "assets"),
    path.join(process.cwd(), "public"),
    path.join(process.cwd(), "frontend", "public"),
    path.join(__dirname, "..", "assets"),
    path.join(__dirname, "..", "..", "backend", "assets"),
    path.join(__dirname, "..", "..", "frontend", "public"),
  ];

  for (const dir of logoDirs) {
    for (const name of logoNames) {
      const candidate = path.join(dir, name);
      if (isUsableLogo(candidate)) return candidate;
    }
  }

  return null;
}

function drawInvoiceLogoFallback(doc, x, y, width) {
  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor("#0b5560")
    .text("SEMAMART", x, y + 18, { width, align: "left" });
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#f59e0b")
    .text("Healthcare Marketplace", x + 2, y + 43, { width, align: "left" });
}

function amountToWords(num) {
  if (num == null) return "";
  const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
    "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  function twoDigit(n){
    if(n<20) return a[n];
    const tens = Math.floor(n/10), rest = n%10;
    return b[tens] + (rest ? " " + a[rest] : "");
  }
  function threeDigit(n){
    const hundred = Math.floor(n/100), rest = n%100;
    return (hundred ? a[hundred] + " Hundred" + (rest ? " " : "") : "") + (rest ? twoDigit(rest) : "");
  }
  if(num===0) return "Zero Rupees Only";
  const crore = Math.floor(num/10000000);
  const lakh = Math.floor((num%10000000)/100000);
  const thousand = Math.floor((num%100000)/1000);
  const below = num%1000;
  const parts = [];
  if(crore) parts.push(threeDigit(crore) + " Crore");
  if(lakh) parts.push(threeDigit(lakh) + " Lakh");
  if(thousand) parts.push(threeDigit(thousand) + " Thousand");
  if(below) parts.push(threeDigit(below));
  return parts.join(" ") + " Rupees Only";
}

/**
 * Generate order invoice PDF on A5 paper.
 * Expects `order` with either order.items[] or order.variant.productId
 * Returns relative path like 'invoices/<orderId>.pdf'
 */
async function generateOrderPdf(order) {
  console.log("generateOrderPdf called for:", order?._id);
  return new Promise((resolve, reject) => {
    try {
      if (!order || !order._id) {
        return reject(new Error("Invalid order passed to generateOrderPdf"));
      }

      const pdfDir = path.join(process.cwd(), "uploads", "invoices");
      try {
        if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
      } catch (mkdirErr) {
        console.error("❌ Could not create invoices directory:", mkdirErr);
        return reject(mkdirErr);
      }

      // --- Order count handling (SM/<YEAR>/<COUNT>) ---
      const counterFile = path.join(pdfDir, "order_count.json");
      const nowYear = new Date().getFullYear();
      let orderCount = 1;
      try {
        if (fs.existsSync(counterFile)) {
          const cnt = JSON.parse(fs.readFileSync(counterFile, "utf8"));
          if (cnt && cnt.year === nowYear && typeof cnt.count === "number") {
            orderCount = cnt.count + 1;
          } else {
            orderCount = 1;
          }
        } else {
          orderCount = 1;
        }
      } catch (err) {
        orderCount = 1;
      }
      try {
        fs.writeFileSync(counterFile, JSON.stringify({ year: nowYear, count: orderCount }, null, 2), "utf8");
      } catch (e) {
        console.warn("⚠️ Could not write order counter file:", e && e.message ? e.message : e);
      }

      const filename = `${order._id}.pdf`;
      const finalPath = path.join(pdfDir, filename);

      // tmp filename (unique)
      const tmpName = `${order._id}.${Date.now()}.${crypto.randomBytes(6).toString('hex')}.tmp`;
      const tmpPath = path.join(pdfDir, tmpName);

      // create write stream to tmp - attach handlers early
      const writeStream = fs.createWriteStream(tmpPath);
      let writeErrored = false;
      writeStream.on("error", (err) => {
        writeErrored = true;
        console.error("❌ PDF writeStream error (tmp):", err);
        // cleanup tmp file if exists
        try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch (_) {}
        return reject(err);
      });

      // A5 (portrait)
      const doc = new PDFDocument({ size: "A5", margin: 12, info: { Title: `Invoice - ${order._id}`, Author: "SEMA Healthcare Pvt. Ltd." } });

      // Safe font loading
      try {
        const possibleFonts = [
          path.join(process.cwd(), "assets", "fonts", "DejaVuSans.ttf"),
          path.join(process.cwd(), "public", "fonts", "DejaVuSans.ttf"),
          path.join(process.cwd(), "assets", "fonts", "NotoSans-Regular.ttf"),
          path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf")
        ];
        const fontPath = possibleFonts.find(p => p && fs.existsSync(p));
        if (fontPath) {
          try {
            doc.registerFont("Main", fontPath);
            doc.font("Main");
            currencySymbol = "₹";
          } catch (e) {
            console.error("⚠️ Font register/load failed:", e && e.message ? e.message : e);
            doc.font("Helvetica");
            currencySymbol = "Rs.";
          }
        } else {
          doc.font("Helvetica");
          currencySymbol = "Rs.";
        }
      } catch (fontErr) {
        console.error("⚠️ Unexpected font handling error:", fontErr);
        doc.font("Helvetica");
        currencySymbol = "Rs.";
      }

      // pipe doc to tmp stream
      doc.pipe(writeStream);
      console.log("Writing PDF (tmp) to:", tmpPath);

      // geometry helpers
      const pageW = doc.page.width, pageH = doc.page.height, margin = doc.page.margins.left;
      const usableW = pageW - margin * 2;

      // ===== header: logo + company =====
      let logoPath = null;
      let logoRendered = false;
      const logoW = 150;
      const logoH = 80;
      try {
        logoPath = getInvoiceLogoPath();
        if (logoPath) {
          try {
            doc.image(logoPath, margin, margin, { fit: [logoW, logoH] });
            logoRendered = true;
          } catch (e) {
            console.error("Logo image load failed:", e && e.message ? e.message : e);
            drawInvoiceLogoFallback(doc, margin, margin, logoW);
            logoRendered = true;
          }
        } else {
          drawInvoiceLogoFallback(doc, margin, margin, logoW);
          logoRendered = true;
        }
        // Keep the legacy inline renderer below from running a second time.
        logoPath = null;
        if (logoPath) {
          try { doc.image(logoPath, margin, margin, { fit: [logoW, logoH] }); } catch (e) { console.error("⚠️ Logo image load failed:", e && e.message ? e.message : e); }
        }
      } catch (e) {
        console.error("⚠️ Logo handling error:", e && e.message ? e.message : e);
      }

      const compBlockW = Math.min(usableW * 0.45, 220);
      const rightAlignX = pageW - margin - compBlockW;
      try {
        doc.fontSize(11).fillColor("#0b5560").font("Main" in doc._fontFamilies ? "Main" : "Helvetica-Bold")
          .text("Sema Healthcare Pvt. Ltd.", rightAlignX, margin, { width: compBlockW, align: "right" });
      } catch (e) {
        doc.fontSize(11).fillColor("#0b5560").text("Sema Healthcare Pvt. Ltd.", rightAlignX, margin, { width: compBlockW, align: "right" });
      }

      doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica").fontSize(8).fillColor("#111");
      const companyLines = [
        "317, 3rd Floor, SS Plaza, Mahavir Enclave",
        "Dwarka Sec-1, Delhi",
        "Pin Code: 110075",
        "Phone No: 01149982773 / 9667747553",
        "Info@semamart.com",
        "GSTIN: 07ABKCS8538F1ZX"
      ];
      let cy = margin + 14;
      companyLines.forEach(line => {
        doc.text(line, rightAlignX, cy, { width: compBlockW, align: "right" });
        cy += 9;
      });

      // Title & separator
      const invoiceY = margin + Math.max(logoRendered ? logoH : 0, (cy - margin)) + 6;
      try { doc.moveTo(margin, invoiceY + 22).lineTo(pageW - margin, invoiceY + 22).strokeColor("#e6eef6").lineWidth(1).stroke(); } catch (e) {}
      doc.fontSize(14).fillColor("#0b5560").font("Main" in doc._fontFamilies ? "Main" : "Helvetica-Bold").text("TAX INVOICE", margin, invoiceY);

      // Invoice meta
     // --- Invoice meta ---
// --- Invoice meta ---
const invDateObj = order.paidAt || order.createdAt || new Date();
const invoiceYear = invDateObj ? new Date(invDateObj).getFullYear() : new Date().getFullYear();
const invoiceNo = `SM/${invoiceYear}/${orderCount}`;

doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica").fontSize(9).fillColor("#333");

// CHANGE: Align metaX with the shipping box column (0.52 fraction)
const metaX = margin + usableW * 0.52; 

doc.text("Invoice No.:", metaX, invoiceY);
doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica-Bold")
   .text(invoiceNo, metaX + 55, invoiceY); // Adjusted offset for better spacing

doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica")
   .fontSize(9)
   .text(`Invoice Date: ${fmtDate(invDateObj)}`, metaX, invoiceY + 12);

      // Place of supply / delivery
      // Place of supply / delivery
const product = (order.variant && order.variant.productId) || {};

let placeOfSupply = [order.dispatchState].filter(Boolean).join(", ");


// if (product.dispatchLocation) {
//   placeOfSupply = product.dispatchLocation;
// } else {
//   const st = product.dispatchState || "";
//   const dist = product.dispatchDistrict || "";
//   placeOfSupply = [st, dist].filter(Boolean).join(", ");
// }

const placeOfDelivery =
  (order.shippingAddress &&
    (order.shippingAddress.state ||
      order.shippingAddress.district ||
      order.shippingAddress.city)) ||
  "";

doc.fontSize(9).fillColor("#333");
doc.text(`Place of Supply: ${placeOfSupply}`, margin, invoiceY + 34);

// CHANGE: Use the same starting X as the shipping address box
doc.text(`Place of Delivery: ${placeOfDelivery}`, margin + usableW * 0.52, invoiceY + 34);


      // Billing / Shipping boxes
      let billObj = {};
      try {
        if (order.user && Array.isArray(order.user.addresses) && order.user.addresses.length) {
          billObj = order.user.addresses[0];
        } else if (order.user && typeof order.user === "object") {
          billObj = order.user;
        } else if (order.billingAddress) {
          billObj = order.billingAddress;
        }
      } catch (e) {
        billObj = order.user || {};
      }

      const billingLines = [];
      if (order.user && order.user.instituteName) billingLines.push(order.user.instituteName);
      else if (billObj.name) billingLines.push(billObj.name);
      else billingLines.push(`${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim() || "");
      if (order.user && (order.user.instituteAddress1 || order.user.instituteAddress2)) {
        if (order.user.instituteAddress1) billingLines.push(order.user.instituteAddress1);
        if (order.user.instituteAddress2) billingLines.push(order.user.instituteAddress2);
      } else {
        if (billObj.addressLine1) billingLines.push(billObj.addressLine1);
        if (billObj.addressLine2) billingLines.push(billObj.addressLine2);
      }
      const cityStateBill = (order.user && (order.user.city || order.user.state)) ? `${order.user.city || ""}${order.user.city ? ", " : ""}${order.user.state || ""}` : ((billObj.city || "") + (billObj.city ? ", " : "") + (billObj.state || ""));
      if (cityStateBill.trim()) billingLines.push(cityStateBill);
      if ((order.user && order.user.pincode) || billObj.pincode) billingLines.push(String(order.user?.pincode || billObj.pincode || ""));
      if (order.user?.email) billingLines.push( order.user.email);
      if (order.user?.phoneNumber) billingLines.push( order.user.phoneNumber);
      if (order.user?.gstNumber) billingLines.push( `GSTIN: ${order.user.gstNumber}`);
      const billingText = billingLines.filter(Boolean).join("\n");

      const ship = order.shippingAddress || {};
      const shipLines = [
        ship.reciever_name || `${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim() || "",
        ship.instituteAddress1 || ship.addressLine1 || "",
        ship.instituteAddress2 || ship.addressLine2 || "",
        (ship.district || ship.city ? `${ship.district || ship.city}, ` : "") + (ship.state || ""),
        ship.pincode ? String(ship.pincode) : "",
        ship.phone ? String(ship.phone) : ""
      ].filter(Boolean);
      const shippingText = shipLines.join("\n");

      const boxColW = usableW * 0.48;
      const textOptions = { width: boxColW - 14, align: "left", lineGap: 2 };
      doc.fontSize(9);
      const billingHeight = doc.heightOfString(billingText || "-", textOptions);
      const shippingHeight = doc.heightOfString(shippingText || "-", textOptions);
      const minBoxH = 72;
      const boxH = Math.max(minBoxH, billingHeight + 20, shippingHeight + 20);
      const boxTop = invoiceY + 64;
      doc.lineWidth(0.8).strokeColor("#c7dff3");
      doc.rect(margin, boxTop, boxColW, boxH).stroke();
      doc.rect(margin + usableW * 0.52, boxTop, boxColW, boxH).stroke();

      doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica-Bold").fontSize(9).fillColor("#000").text("Billing Address:", margin + 8, boxTop + 6);
      doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica").fontSize(9).fillColor("#000").text(billingText || "-", margin + 8, boxTop + 20, textOptions);
      doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica-Bold").fontSize(9).fillColor("#000").text("Shipping Address:", margin + usableW * 0.52 + 8, boxTop + 6);
      doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica").fontSize(9).fillColor("#000").text(shippingText || "-", margin + usableW * 0.52 + 8, boxTop + 20, textOptions);

      // === Items table with wrapping and measured row height ===
      const tableTop = boxTop + boxH + 18;
      const tableLeft = margin;
      const tableWidth = usableW;

      const totalTaxAmount =
        Number(order.cgst_amount || 0) +
        Number(order.sgst_amount || 0) +
        Number(order.igst_amount || 0);
      const totalTaxRate =
        Number(order.tax || 0) ||
        Number(order.cgst_rate || 0) +
          Number(order.sgst_rate || 0) +
          Number(order.igst_rate || 0);
      const unitRateExcludingTax = Number(order.discounted_amount || order.unitPrice || 0);
      const orderQty = Number(order.qty || 1);
      const taxableAmount = Number((unitRateExcludingTax * orderQty).toFixed(2));
      const computedGrandTotal = Number((taxableAmount + totalTaxAmount).toFixed(2));

      const colSno = 22;
      const colQty = 22;

      const descFraction = 0.25;
      const hsnFraction = 0.11;
      const rateFraction = 0.12;
      const taxRateFraction = 0.09;
      const taxAmountFraction = 0.14;

      const colDesc = Math.round(tableWidth * descFraction);
      const colHsn = Math.round(tableWidth * hsnFraction);
      const colRate = Math.round(tableWidth * rateFraction);
      const colTaxRate = Math.round(tableWidth * taxRateFraction);
      const colTaxAmount = Math.round(tableWidth * taxAmountFraction);
      const colSumBeforeLast =
        colSno + colDesc + colHsn + colQty + colRate + colTaxRate + colTaxAmount;
      const colTotal = tableWidth - colSumBeforeLast;

      const cols = [
        { key: "sno", width: colSno },
        { key: "desc", width: colDesc },
        { key: "hsn", width: colHsn },
        { key: "qty", width: colQty },
        { key: "rate", width: colRate },
        { key: "taxRate", width: colTaxRate },
        { key: "taxAmount", width: colTaxAmount },
        { key: "totalPrice", width: colTotal },
      ];

      try { doc.rect(tableLeft, tableTop, tableWidth, 22).fill("#f7fbff").strokeColor("#dbeefb").lineWidth(0.6).stroke(); } catch (e) {}
      doc.fillColor("#333").font("Main" in doc._fontFamilies ? "Main" : "Helvetica-Bold").fontSize(7);
      let x = tableLeft + 6;
      const titles = ["S.No", "Description", "HSN", "Qty", "Rate", "GST %", "GST Amt", "Total"];
      for (let i = 0; i < cols.length; i++) {
        const rightAlign = ["qty", "rate", "taxRate", "taxAmount", "totalPrice"].includes(cols[i].key);
        doc.text(titles[i], x, tableTop + 6, { width: cols[i].width - 8, align: rightAlign ? "right" : "left" });
        x += cols[i].width;
      }
      doc.fillColor("#000").font("Main" in doc._fontFamilies ? "Main" : "Helvetica");

      const itemsArr = Array.isArray(order.items) && order.items.length ? order.items : [
        {
          name: (product && product.name) || "Item",
          hsn: (product && (product.hsn || product.hsnCode)) || "",
          qty: orderQty,
          rate: unitRateExcludingTax,
          taxRate: totalTaxRate,
          taxAmount: totalTaxAmount,
          totalPrice: computedGrandTotal,
        }
      ];

      let cursorY = tableTop + 26;
      const rowPadding = 6;
      const footerReserve = 140;
      for (let idx = 0; idx < itemsArr.length; idx++) {
        const it = itemsArr[idx];
        const desc = String(it.name || "");
        const hsn = String(it.hsn || "");
        const qty = String(it.qty == null ? 1 : it.qty);
        const rate = Number(it.rate || 0);
        const taxRate = Number(it.taxRate || 0);
        const taxAmount = Number(it.taxAmount || 0);
        const totalPrice = Number(it.totalPrice || 0);

        const descWidth = cols[1].width - 8;
        const descHeight = doc.heightOfString(desc || "-", { width: descWidth, lineGap: 2 });
        const cellHeight = Math.max(20, descHeight + rowPadding * 2);

        if (cursorY + cellHeight + footerReserve > pageH - margin) {
          doc.addPage();
          const newTop = margin;
          try { doc.rect(tableLeft, newTop, tableWidth, 22).fill("#f7fbff").strokeColor("#dbeefb").lineWidth(0.6).stroke(); } catch (e) {}
          doc.fillColor("#333").font("Main" in doc._fontFamilies ? "Main" : "Helvetica-Bold").fontSize(9);
          let xx = tableLeft + 6;
          for (let i = 0; i < cols.length; i++) {
        const rightAlign = ["qty", "rate", "taxRate", "taxAmount", "totalPrice"].includes(cols[i].key);
            doc.text(titles[i], xx, newTop + 6, { width: cols[i].width - 8, align: rightAlign ? "right" : "left" });
            xx += cols[i].width;
          }
          doc.fillColor("#000").font("Main" in doc._fontFamilies ? "Main" : "Helvetica");
          cursorY = newTop + 26;
        }

        if (idx % 2 === 1) {
          try { doc.rect(tableLeft, cursorY - 4, tableWidth, cellHeight + 4).fillOpacity(0.03).fill("#000").fillOpacity(1); } catch (e) {}
        }

        let cx = tableLeft + 6;
        doc.text(String(idx + 1), cx, cursorY, { width: cols[0].width - 8, align: "left" });
        cx += cols[0].width;

        doc.text(desc, cx, cursorY, { width: cols[1].width - 8, align: "left", lineGap: 2 });
        cx += cols[1].width;

        doc.text(hsn, cx, cursorY, { width: cols[2].width - 8, align: "left" });
        cx += cols[2].width;

        doc.text(qty, cx, cursorY, { width: cols[3].width - 8, align: "right" });
        cx += cols[3].width;

        doc.text(formatCurrency(rate), cx, cursorY, { width: cols[4].width - 8, align: "right" });
        cx += cols[4].width;

        doc.text(`${taxRate.toFixed(2)}%`, cx, cursorY, { width: cols[5].width - 8, align: "right" });
        cx += cols[5].width;

        doc.text(formatCurrency(taxAmount), cx, cursorY, { width: cols[6].width - 8, align: "right" });
        cx += cols[6].width;

        doc.text(formatCurrency(totalPrice), cx, cursorY, { width: cols[7].width - 8, align: "right" });

        const rowBottom = cursorY + cellHeight;
        try {
          doc.lineWidth(0.5).strokeColor("#cfcfcf");
          doc.rect(tableLeft, cursorY - 4, tableWidth, cellHeight + 4).stroke();
          let vx = tableLeft;
          cols.forEach(col => {
            doc.moveTo(vx, cursorY - 4).lineTo(vx, rowBottom).stroke();
            vx += col.width;
          });
          doc.moveTo(tableLeft + tableWidth, cursorY - 4).lineTo(tableLeft + tableWidth, rowBottom).stroke();
        } catch (e) {}

        cursorY = rowBottom + 6;
      }

        // ===== GST TABLE WITH TOTAL TAX AMOUNT COLUMN =====
        let gstTableTop = cursorY + 10;
        const gstRowHeight = 18;

        // Page break safety
        if (gstTableTop + 120 > pageH - margin) {
          doc.addPage();
          gstTableTop = margin;
        }

        const gstTableWidth = usableW;

        // Column widths
        const colTaxType = Math.round(gstTableWidth * 0.25);
        const gstColRate = Math.round(gstTableWidth * 0.15);
        const colAmount = Math.round(gstTableWidth * 0.25);
        const colTotalTax = gstTableWidth - colTaxType - gstColRate - colAmount;

        // For now, show the applied tax regime as a single GST/Tax row.
        // Later this can be expanded back into CGST/SGST/IGST breakup.
        const gstRows = [
          {
            label: "GST / Other Tax",
            rate: totalTaxRate,
            amount: totalTaxAmount,
          },
        ].filter((r) => Number(r.amount) > 0);

        const totalTaxAmountFromRows = gstRows.reduce(
          (sum, r) => sum + Number(r.amount || 0),
          0,
        );

        // Table height
        const tableHeight = gstRowHeight * (gstRows.length + 1);

        // Outer border
        doc.lineWidth(0.8).strokeColor("#c7dff3");
        doc.rect(margin, gstTableTop, gstTableWidth, tableHeight).stroke();

        // Header background
        doc.rect(margin, gstTableTop, gstTableWidth, gstRowHeight)
          .fill("#f7fbff");

        // Header text
        doc.fillColor("#333")
          .fontSize(8)
          .font("Main" in doc._fontFamilies ? "Main" : "Helvetica-Bold");

        doc.text("Tax Type", margin + 6, gstTableTop + 5);
        doc.text("Rate (%)", margin + colTaxType + 6, gstTableTop + 5);
        doc.text("Amount", margin + colTaxType + gstColRate + 6, gstTableTop + 5);
        doc.text(
          "Total Tax Amount",
          margin + colTaxType + gstColRate + colAmount + 6,
          gstTableTop + 5,
          { width: colTotalTax - 12, align: "right" }
        );

        // Vertical lines
        let vx = margin;
        [
          colTaxType,
          gstColRate,
          colAmount
        ].forEach(w => {
          vx += w;
          doc.moveTo(vx, gstTableTop)
            .lineTo(vx, gstTableTop + tableHeight)
            .stroke();
        });

        // Reset font
        doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica")
          .fillColor("#000");

        // Rows
        let rowY = gstTableTop + gstRowHeight;

        gstRows.forEach((row, index) => {
          // Horizontal line
          doc.moveTo(margin, rowY)
            .lineTo(margin + gstTableWidth, rowY)
            .stroke();

          // Row text
          doc.text(row.label, margin + 6, rowY + 5);
          doc.text(`${row.rate || 0}%`, margin + colTaxType + 6, rowY + 5);
          doc.text(
            formatCurrency(row.amount || 0),
            margin + colTaxType + gstColRate + 6,
            rowY + 5
          );

          // Show total tax amount only in FIRST row
          if (index === 0) {
            doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica-Bold");
            doc.text(
              formatCurrency(totalTaxAmountFromRows),
              margin + colTaxType + gstColRate + colAmount + 6,
              rowY + 5,
              { width: colTotalTax - 12, align: "right" }
            );
            doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica");
          }

          rowY += gstRowHeight;
        });

        // Bottom border
        doc.moveTo(margin, gstTableTop + tableHeight)
          .lineTo(margin + gstTableWidth, gstTableTop + tableHeight)
          .stroke();

        // Move cursor down
        cursorY = gstTableTop + tableHeight + 10;



      // compute totals
      const subtotal = itemsArr.reduce(
        (s, it) => s + Number(it.rate || 0) * Number(it.qty || 1),
        0,
      );
      const grandTotal = Number(
        (
          Number.isFinite(Number(order.totalPrice))
            ? Number(order.totalPrice)
            : computedGrandTotal
        ).toFixed(2),
      );

      // totals block
      const totalsX = tableLeft + tableWidth * 0.52;
      let ty = cursorY + 10;

      ty += 12;
      doc.fontSize(9).fillColor("#555").text("Taxable Amount:", totalsX, ty);
      doc.fillColor("#000").text(formatCurrency(subtotal), totalsX + 84, ty, { align: "right" });

      ty += 12;
      doc.fontSize(9).fillColor("#555").text(`GST (${totalTaxRate.toFixed(2)}%):`, totalsX, ty);
      doc.fillColor("#000").text(formatCurrency(totalTaxAmount), totalsX + 84, ty, { align: "right" });

     


      ty += 14;
      doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica-Bold").fontSize(10).fillColor("#000").text("Grand Total:", totalsX, ty);
      doc.text(formatCurrency(grandTotal), totalsX + 84, ty, { align: "right" });

      // Define the width (e.g., 75% of the page)
      const increasedWidth = usableW * 0.75; 
      const leftColumnX = margin; 
      const wordsBoxHeight = 35; 
      const boxY = ty + 14; 

      // Draw the border
      doc.lineWidth(0.8).strokeColor("#c7dff3");
      doc.rect(leftColumnX, boxY, increasedWidth, wordsBoxHeight).stroke();

      // FIX: Use the 'Main' registration check you have at the top of your file
      const boldFont = "Main" in doc._fontFamilies ? "Main" : "Helvetica-Bold";
      const regularFont = "Main" in doc._fontFamilies ? "Main" : "Helvetica";

      // Label - Using Safe Bold Font
      doc.font(boldFont).fontSize(9).fillColor("#000")
        .text("Amount In Words:", leftColumnX + 6, boxY + 6);

      // Value - Using Safe Regular Font
      doc.font(regularFont).fontSize(9).fillColor("#000")
        .text(amountToWords(Math.round(grandTotal)), leftColumnX + 6, boxY + 18, { 
            width: increasedWidth - 12, 
            align: "left" 
        });

      cursorY = boxY + wordsBoxHeight + 10;
    

      // Signature (guarded)
  try {
  const possibleSignatures = [
    path.join(process.cwd(), "assets", "Auth.png"),
    path.join(process.cwd(), "public", "Auth.png"),
    path.join(process.cwd(), "public", "assets", "Auth.png"),
    path.join(__dirname, "..", "assets", "Auth.png"),
    path.join(process.cwd(), "backend", "assets", "Auth.png")
  ];
  const sigPath = possibleSignatures.find(p => p && fs.existsSync(p));
  
  // Define dimensions and coordinates for bottom right
  const sigW = 80;
  const sigX = pageW - margin - sigW - 10; // 10px padding from right margin
  const sigY = pageH - margin - 80;        // Positioned above the footer

  if (sigPath) {
    try {
      doc.image(sigPath, sigX, sigY, { width: sigW });
    } catch (e) {
      console.error("⚠️ Signature image load failed:", e.message);
    }
  }

  // Authorized label - positioned directly under the seal
  doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica")
     .fontSize(9)
     .fillColor("#666")
     .text("Authorized Signatory", sigX - 10, sigY + 45, { width: sigW + 20, align: "center" });

} catch (e) {
  console.error("⚠️ Signature handling error:", e.message);
}

      // Footer
      try { doc.fontSize(8).fillColor("#999").text("This is a computer generated invoice.", margin, pageH - margin - 14, { align: "center", width: usableW }); } catch (e) {}

      // finalize - attach listeners BEFORE doc.end()
      let finished = false;
      writeStream.on("finish", () => {
        // rename tmp -> final atomically
        try {
          if (fs.existsSync(finalPath)) {
            try { fs.unlinkSync(finalPath); } catch (_) {}
          }
          fs.rename(tmpPath, finalPath, (err) => {
            if (err) {
              console.error("Failed to rename tmp PDF to final:", err);
              try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch (_) {}
              return reject(err);
            }
            finished = true;
            console.log("✅ PDF written and moved to:", finalPath);
            return resolve(`invoices/${filename}`);
          });
        } catch (renameErr) {
          console.error("Unexpected rename error:", renameErr);
          try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch (_) {}
          return reject(renameErr);
        }
      });

      writeStream.on("close", () => {
        if (!finished) {
          // some environments emit close instead of finish
          try {
            if (fs.existsSync(tmpPath)) {
              if (fs.existsSync(finalPath)) {
                try { fs.unlinkSync(finalPath); } catch (_) {}
              }
              fs.renameSync(tmpPath, finalPath);
              finished = true;
              console.log("✅ PDF stream closed -> moved tmp to final:", finalPath);
              return resolve(`invoices/${filename}`);
            }
          } catch (e) {
            console.error("Error in close handler:", e);
            try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch (_) {}
            return reject(e);
          }
        }
      });

      writeStream.on("error", (err) => {
        console.error("❌ PDF writeStream error (late):", err);
        try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch (_) {}
        return reject(err);
      });

      try {
        doc.end();
      } catch (e) {
        console.error("❌ doc.end() failed:", e && e.message ? e.message : e);
        try { writeStream.destroy(); } catch (_) {}
        try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch (_) {}
        return reject(e);
      }
    } catch (err) {
      console.error("❌ Unexpected error in generateOrderPdf:", err && err.stack ? err.stack : err);
      return reject(err);
    }
  });
}

module.exports = generateOrderPdf;
