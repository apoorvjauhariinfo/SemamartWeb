// backend/utils/generateOrderPdf.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let currencySymbol = "Rs."; // fallback

function fmtDate(d) {
  try { return new Date(d).toLocaleString("en-IN"); } catch (e) { return ""; }
}
function formatCurrency(n) {
  if (n == null || Number.isNaN(Number(n))) return `${currencySymbol}0.00`;
  return currencySymbol + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
      const doc = new PDFDocument({ size: "A5", margin: 28, info: { Title: `Invoice - ${order._id}`, Author: "SEMA Healthcare Pvt. Ltd." } });

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
      const logoW = 150;
      const logoH = 80;
      try {
        const possibleLogos = [
          path.join(process.cwd(), "assets", "Logo.png"),
          path.join(process.cwd(), "assets", "Logo-imag.png"),
          path.join(process.cwd(), "public", "Logo.png"),
          path.join(process.cwd(), "public", "Logo-imag.png"),
          path.join(__dirname, "..", "assets", "Logo.png")
        ];
        logoPath = possibleLogos.find(p => p && fs.existsSync(p)) || null;
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
        "Dwarka Sec-1, Delhi-110045",
        "Ph: 01149982773 / 9667747553",
        "Info@semamart.com",
        "GSTIN: 07ABKCS8538F1ZX"
      ];
      let cy = margin + 14;
      companyLines.forEach(line => {
        doc.text(line, rightAlignX, cy, { width: compBlockW, align: "right" });
        cy += 9;
      });

      // Title & separator
      const invoiceY = margin + Math.max(logoPath ? logoH : 0, (cy - margin)) + 6;
      try { doc.moveTo(margin, invoiceY + 22).lineTo(pageW - margin, invoiceY + 22).strokeColor("#e6eef6").lineWidth(1).stroke(); } catch (e) {}
      doc.fontSize(14).fillColor("#0b5560").font("Main" in doc._fontFamilies ? "Main" : "Helvetica-Bold").text("ORDER INVOICE", margin, invoiceY);

      // Invoice meta
      const invDateObj = order.verifiedAt || new Date();
      const invoiceYear = invDateObj ? new Date(invDateObj).getFullYear() : new Date().getFullYear();
      const invoiceNo = `SM/${invoiceYear}/${orderCount}`;
      doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica").fontSize(9).fillColor("#333");
      const metaX = margin + usableW * 0.55;
      doc.text("Invoice No.:", metaX, invoiceY);
      doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica-Bold").text(invoiceNo, metaX + 72, invoiceY);
      doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica").fontSize(9).text(`Invoice Date: ${fmtDate(invDateObj)}`, metaX, invoiceY + 12);

      // Place of supply / delivery
      // Place of supply / delivery
const product = (order.variant && order.variant.productId) || {};

let placeOfSupply = [order.dispatchState, order.dispatchDistrict].filter(Boolean).join(", ");


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
doc.text(`Place of Delivery: ${placeOfDelivery}`, margin + usableW * 0.5, invoiceY + 34);


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
      if (order.user?.email) billingLines.push(`Email: ${order.user.email}`);
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

      doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica-Bold").fontSize(9).fillColor("#666").text("Billing Address:", margin + 8, boxTop + 6);
      doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica").fontSize(9).fillColor("#000").text(billingText || "-", margin + 8, boxTop + 20, textOptions);
      doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica-Bold").fontSize(9).fillColor("#666").text("Shipping Address:", margin + usableW * 0.52 + 8, boxTop + 6);
      doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica").fontSize(9).fillColor("#000").text(shippingText || "-", margin + usableW * 0.52 + 8, boxTop + 20, textOptions);

      // === Items table with wrapping and measured row height ===
      const tableTop = boxTop + boxH + 18;
      const tableLeft = margin;
      const tableWidth = usableW;

      const colSno = 28;
      const colQty = 36;
      const descFraction = 0.36;
      const hsnFraction = 0.12;
      const unitFraction = 0.18;
      const colDesc = Math.round(tableWidth * descFraction);
      const colHsn = Math.round(tableWidth * hsnFraction);
      const colUnit = Math.round(tableWidth * unitFraction);
      const colSumBeforeLast = colSno + colDesc + colHsn + colQty + colUnit;
      const colTotal = tableWidth - colSumBeforeLast;

      const cols = [
        { key: "sno", width: colSno },
        { key: "desc", width: colDesc },
        { key: "hsn", width: colHsn },
        { key: "qty", width: colQty },
        { key: "unitPrice", width: colUnit },
        { key: "totalPrice", width: colTotal },
      ];

      try { doc.rect(tableLeft, tableTop, tableWidth, 22).fill("#f7fbff").strokeColor("#dbeefb").lineWidth(0.6).stroke(); } catch (e) {}
      doc.fillColor("#333").font("Main" in doc._fontFamilies ? "Main" : "Helvetica-Bold").fontSize(9);
      let x = tableLeft + 6;
      const titles = ["S.No", "Description of Goods", "HSN", "Qty", "Unit Price", "Total Price"];
      for (let i = 0; i < cols.length; i++) {
        const rightAlign = ["qty", "unitPrice", "totalPrice"].includes(cols[i].key);
        doc.text(titles[i], x, tableTop + 6, { width: cols[i].width - 8, align: rightAlign ? "right" : "left" });
        x += cols[i].width;
      }
      doc.fillColor("#000").font("Main" in doc._fontFamilies ? "Main" : "Helvetica");

      const itemsArr = Array.isArray(order.items) && order.items.length ? order.items : [
        {
          name: (product && product.name) || "Item",
          hsn: (product && (product.hsn || product.hsnCode)) || "",
          qty: order.qty || 1,
          unitPrice: order.unitPrice || 0
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
        const unitPrice = Number(it.unitPrice || 0);
        const totalPrice = Number((unitPrice * Number(qty)).toFixed(2));

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
            const rightAlign = ["qty", "unitPrice", "totalPrice"].includes(cols[i].key);
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

        doc.text(formatCurrency(unitPrice), cx, cursorY, { width: cols[4].width - 8, align: "right" });
        cx += cols[4].width;

        doc.text(formatCurrency(totalPrice), cx, cursorY, { width: cols[5].width - 8, align: "right" });

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

      // compute totals
      const subtotal = itemsArr.reduce((s, it) => s + (Number(it.unitPrice || 0) * Number(it.qty || 1)), 0);
      const gstRate = (order.tax != null ? Number(order.tax) : (product.tax != null ? Number(product.tax) : 0));
      const gstAmount = Number((subtotal * gstRate / 100).toFixed(2));
      const grandTotal = Number((subtotal + gstAmount).toFixed(2));

      // totals block
      const totalsX = tableLeft + tableWidth * 0.52;
      let ty = Math.max(cursorY, tableTop + 80);
      doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica").fontSize(9).fillColor("#555").text("GST Type:", totalsX, ty);
      doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica").fillColor("#000").text("", totalsX + 84, ty, { align: "right" });

      ty += 12;
      doc.fontSize(9).fillColor("#555").text("GST Rate:", totalsX, ty);
      doc.fillColor("#000").text(`${gstRate}%`, totalsX + 84, ty, { align: "right" });

      ty += 12;
      doc.fontSize(9).fillColor("#555").text("GST Amount:", totalsX, ty);
      doc.fillColor("#000").text(formatCurrency(gstAmount), totalsX + 84, ty, { align: "right" });

      ty += 12;
      doc.fontSize(9).fillColor("#555").text("Subtotal:", totalsX, ty);
      doc.fillColor("#000").text(formatCurrency(subtotal), totalsX + 84, ty, { align: "right" });

      ty += 14;
      doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica-Bold").fontSize(10).fillColor("#000").text("Grand Total:", totalsX, ty);
      doc.text(formatCurrency(grandTotal), totalsX + 84, ty, { align: "right" });

      // Amount in words
      doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica").fontSize(9).fillColor("#333");
      doc.text("Amount In Words:", margin, ty + 26);
      doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica").fontSize(9).fillColor("#000").text(amountToWords(Math.round(grandTotal)), margin + 110, ty + 22, { width: usableW - 120 });

      // Signature (guarded)
      try {
        const possibleSignatures = [
          path.join(process.cwd(), "assets", "auth.png"),
          path.join(process.cwd(), "public", "auth.png"),
          path.join(process.cwd(), "public", "assets", "auth.png"),
          path.join(__dirname, "..", "assets", "auth.png"),
          path.join(process.cwd(), "backend", "assets", "auth.png")
        ];
        const sigPath = possibleSignatures.find(p => p && fs.existsSync(p));
        if (sigPath) {
          try {
            const sigW = 80;
            const sigX = totalsX + 8;
            const sigY = ty + 24;
            doc.image(sigPath, sigX, sigY, { width: sigW });
          } catch (e) {
            console.error("⚠️ Signature image load failed:", e && e.message ? e.message : e);
          }
        }
      } catch (e) {
        console.error("⚠️ Signature handling error:", e && e.message ? e.message : e);
      }

      // Authorized label
      doc.font("Main" in doc._fontFamilies ? "Main" : "Helvetica").fontSize(9).fillColor("#666").text("Authorized Signatory", totalsX + 16, ty + 64);

      // Footer
      try { doc.fontSize(8).fillColor("#999").text("This is a computer generated invoice.", margin, pageH - margin - 18, { align: "center", width: usableW }); } catch (e) {}

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
