// backend/utils/generateUserPdf.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function formatDate(d) {
  try { return new Date(d).toLocaleString("en-IN"); } catch (e) { return ""; }
}

/**
 * Generate a registration PDF for a user.
 * Returns a relative path like 'uploads/pdfs/<userId>.pdf'
 */
async function generateUserPdf(user) {
  return new Promise((resolve, reject) => {
    try {
      const pdfDir = path.join(process.cwd(), "uploads", "pdfs");
      if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

      const filename = `${user._id}.pdf`;
      const filePath = path.join(pdfDir, filename);
      const writeStream = fs.createWriteStream(filePath);

      // IMPORTANT: left/right margins preserved; top/bottom set to 0 so header/footer can be flush
      const doc = new PDFDocument({
        size: "A4",
        margin: { top: 0, bottom: 0, left: 40, right: 40 },
        info: {
          Title: `User Registration - ${user.firstName || ""} ${user.lastName || ""}`.trim(),
          Author: "SEMA Healthcare Pvt. Ltd.",
        },
      });

      // Styles
      const FONT_REGULAR = "Helvetica";
      const FONT_BOLD = "Helvetica-Bold";
      const BRAND_ORANGE = "#F9A11B";
      const BRAND_TEAL = "#1C6C84";
      const TEXT_DARK = "#333333";
      const MUTED = "#6B7280";

      // Fallback middle color (if gradient not supported)
      const HEADER_MIX_BG = "#B6C0A0";

      // Layout
      const PAGE_MARGIN = doc.page.margins.left || 40; // same for right
      const contentX = PAGE_MARGIN + 20;
      const contentWidth = doc.page.width - PAGE_MARGIN * 2 - 40;
      const HEADER_HEIGHT = 86;
      const FOOTER_HEIGHT = 64;

      const logoPath = path.join(process.cwd(), "assets", "logo.png");

      let pageNumber = 1;

      // Draw full-width header at very top (y = 0)
    function drawHeader() {
  const pageW = doc.page.width;
  const headerY = 0;
  const headerH = HEADER_HEIGHT;

  doc.save();

  // White background
  doc.rect(0, headerY, pageW, headerH).fill("#FFFFFF");

  // Top teal line
  doc.strokeColor(BRAND_TEAL).lineWidth(3);
  doc.moveTo(0, headerY + 6).lineTo(pageW, headerY + 6).stroke();

  // Bottom orange line
  doc.strokeColor(BRAND_ORANGE).lineWidth(3);
  doc.moveTo(0, headerY + headerH - 6).lineTo(pageW, headerY + headerH - 6).stroke();

  // Logo centered
  const logoMaxWidth = 180;
  const logoX = (pageW - logoMaxWidth) / 2;
  const logoY = headerY + 18;

  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, logoX, logoY, { width: logoMaxWidth });
    } catch (e) {
      doc.circle(pageW / 2, logoY + 20, 10).fill(BRAND_ORANGE);
    }
  } else {
    doc.circle(pageW / 2, logoY + 20, 10).fill(BRAND_ORANGE);
  }

  // Decorative diagonals (same as seller)
  const dX = pageW - 72;
  const dY = headerY + 22;

  doc.strokeColor(BRAND_TEAL).lineWidth(1.2);
  doc.moveTo(dX, dY).lineTo(dX + 16, dY + 16).stroke();

  doc.strokeColor(BRAND_ORANGE).lineWidth(1.2);
  doc.moveTo(dX + 8, dY).lineTo(dX + 24, dY + 16).stroke();

  // Content starts below header
  doc.x = contentX;
  doc.y = headerY + headerH + 12;

  doc.restore();
}


      // Draw full-width footer at extreme bottom
      function drawFooter(pgNum) {
        try {
          const footerTopY = doc.page.height - FOOTER_HEIGHT + 8;
          const footerWidth = doc.page.width;
          const left = 0;

          doc.save();
          doc.font(FONT_REGULAR).fontSize(9).fillColor(MUTED);

          doc.text(
            "SEMA Healthcare Private Limited | info@semamart.com | GST: 07ABKCS8538F1ZX",
            left,
            footerTopY,
            { width: footerWidth, align: "center" }
          );

          doc.text(
            "+91 93196 54455 | +91 73037 69555",
            left,
            footerTopY + 12,
            { width: footerWidth, align: "center" }
          );

          // page number on right
          doc.text(
            `Page ${pgNum}`,
            left,
            footerTopY + 26,
            { width: footerWidth - 24, align: "right" }
          );

          doc.restore();
        } catch (e) {
          // ignore footer errors
        }
      }

      // Ensure enough vertical space before writing blocks (avoid footer area)
      function ensureSpace(requiredHeight = 60) {
        // bottom limit respects reserved FOOTER_HEIGHT
        const bottomLimit = doc.page.height - FOOTER_HEIGHT - 10;
        if (typeof doc.y !== "number") doc.y = HEADER_HEIGHT + 12;
        if (doc.y + requiredHeight > bottomLimit) {
          // before adding a new page, draw footer for current page
          drawFooter(pageNumber);
          doc.addPage();
        }
      }

      // Pipe BEFORE drawing content (important)
      doc.pipe(writeStream);

      // When a page is added, increment and draw header
      doc.on("pageAdded", () => {
        pageNumber++;
        drawHeader();
        doc.fillColor(TEXT_DARK);
        doc.font(FONT_REGULAR);
        doc.fontSize(10);
      });

      // Draw first page header
      drawHeader();
      doc.fillColor(TEXT_DARK);
      doc.font(FONT_REGULAR);
      doc.fontSize(10);

      // ---------- Content helper functions ----------
      function writeHeading(text, opts = {}) {
        ensureSpace(34);
        doc.font(FONT_BOLD).fontSize(opts.size || 16).fillColor(TEXT_DARK);
        doc.text(text, contentX, doc.y, { width: contentWidth, align: opts.align || "center" });
        doc.moveDown(0.6);
        doc.fillColor(TEXT_DARK);
      }

      function writePara(text) {
        ensureSpace(16);
        doc.font(FONT_REGULAR).fontSize(10).fillColor(TEXT_DARK);
        doc.text(text, contentX, doc.y, { width: contentWidth, align: "left", lineGap: 2 });
        doc.moveDown(0.3);
      }

      function writeLabel(label, value) {
        ensureSpace(12);
        doc.font(FONT_BOLD).fontSize(10).fillColor(BRAND_TEAL).text(label, contentX, doc.y, { continued: true });
        doc.font(FONT_REGULAR).fillColor(TEXT_DARK).text(` ${value || "-"}`);
        doc.moveDown(0.3);
      }

      // ---------- Body (kept similar to your original content) ----------
      writeHeading("SEMAMART TERMS & CONDITIONS", { size: 16, align: "center" });
      writeLabel("Effective Date:", formatDate(user.createdAt));
      writeLabel("Platform Owner:", "Semamart");
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "-";
      writeLabel("User / Institute:", fullName);

      if (Array.isArray(user.addresses) && user.addresses.length) {
        ensureSpace(10);
        doc.font(FONT_BOLD).fontSize(12).fillColor(BRAND_TEAL).text("Addresses", contentX, doc.y, { width: contentWidth });
        doc.moveDown(0.2);
        doc.fillColor(TEXT_DARK);

        user.addresses.forEach((a, i) => {
          ensureSpace(8);
          doc.font(FONT_BOLD).fontSize(10).fillColor(BRAND_TEAL).text(`${i + 1}. ${a.reciever_name || "-"}`, contentX, doc.y, { width: contentWidth });
          doc.moveDown(0.1);

          doc.font(FONT_REGULAR).fontSize(10).fillColor(TEXT_DARK);
          if (a.instituteAddress1) { ensureSpace(6); doc.text(a.instituteAddress1, contentX + 12, doc.y, { width: contentWidth - 12 }); doc.moveDown(0.1); }
          if (a.instituteAddress2) { ensureSpace(6); doc.text(a.instituteAddress2, contentX + 12, doc.y, { width: contentWidth - 12 }); doc.moveDown(0.1); }

          const districtStatePincode = [a.district, a.state].filter(Boolean).join(", ");
          const plusPincode = a.pincode ? (districtStatePincode ? ` - ${a.pincode}` : a.pincode) : districtStatePincode;
          if (plusPincode) { ensureSpace(6); doc.text(plusPincode, contentX + 12, doc.y, { width: contentWidth - 12 }); doc.moveDown(0.1); }

          if (a.phone) {
            ensureSpace(6);
            doc.font(FONT_BOLD).fontSize(10).fillColor(BRAND_TEAL).text("Phone:", contentX + 12, doc.y, { continued: true });
            doc.font(FONT_REGULAR).fillColor(TEXT_DARK).text(` ${a.phone}`);
            doc.moveDown(0.1);
          }

          if (a.gstNumber || a.gstin) {
            ensureSpace(6);
            doc.font(FONT_BOLD).fontSize(10).fillColor(BRAND_TEAL).text("GST:", contentX + 12, doc.y, { continued: true });
            doc.font(FONT_REGULAR).fillColor(TEXT_DARK).text(` ${a.gstNumber || a.gstin}`);
            doc.moveDown(0.1);
          }

          doc.moveDown(0.3);
        });
      } else {
        ensureSpace(10);
        doc.font(FONT_BOLD).fontSize(12).fillColor(BRAND_TEAL).text("Address", contentX, doc.y, { width: contentWidth });
        doc.moveDown(0.2);
        doc.fillColor(TEXT_DARK);
        ensureSpace(6);
        const fallback = [user.instituteName].filter(Boolean).join(" | ") || "-";
        doc.font(FONT_REGULAR).fontSize(10).text(fallback, contentX, doc.y, { width: contentWidth });
        doc.moveDown(0.2);
      }

      let primary = (Array.isArray(user.addresses) && user.addresses.length) ? user.addresses[0] : null;
      const phoneLine = primary?.phone || user.phoneNumber || "-";
      const gstNumber = user.gstNumber || user.gstin || user.instituteGst || user.instituteGST || user.GST || primary?.gstNumber || primary?.gstin || "-";

      ensureSpace(12);
      doc.font(FONT_BOLD).fontSize(11).fillColor(BRAND_TEAL).text("Contact / GST", contentX, doc.y, { width: contentWidth });
      doc.moveDown(0.2);
      doc.fillColor(TEXT_DARK);

      writeLabel("Phone:", phoneLine);
      writeLabel("GST:", gstNumber !== "-" ? gstNumber : "-");

      const termsText = `
1. Definitions
Buyer/Institute: Organization purchasing products/services via SEMAMART.
Seller/Vendor: Third-party supplier listing products/services on SEMAMART.
Platform: SEMAMART website/app, dashboards, and order management system.
Products/Services: Items or services listed for procurement.
Order: Buyer’s confirmed purchase request.
Transaction: Commercial exchange facilitated via SEMAMART.

2. Platform Role
SEMAMART is a technology and procurement facilitation platform.
SEMAMART is not a manufacturer, importer, or seller unless stated.
Seller is responsible for product quality, compliance, warranty, and delivery.

3. Eligibility & Registration
Buyer must be a legally valid entity under applicable laws.
Buyer must provide accurate registration and license details.
Buyer is responsible for safeguarding login credentials.

4. Product Information & Pricing
Prices may be inclusive/exclusive of GST.
Images are indicative; actual specs may vary.
Prices finalize at checkout / PO confirmation.

5. Orders & Confirmation
Orders are confirmed only after buyer approval, seller acceptance, and payment/credit validation.

6. Payments & Invoicing
Buyer agrees to pay total order value including applicable charges.
Invoices are raised by Seller or SEMAMART (where applicable).

7. Delivery & Receipt
Buyer must verify goods at delivery and report discrepancies within 24–48 hours.

8. Returns, Replacements & Warranty
Returns governed by supplier policy.
Consumables and sterile items are generally non-returnable.
Warranty is provided by Seller/Manufacturer.

9. Cancellation Policy
Cancellation allowed only before dispatch. Charges may apply.

10. Disputes & Resolution
SEMAMART provides dispute resolution support based on evidence and seller response.

11. Compliance with Laws
Buyer must comply with all applicable laws and regulations.

12. Prohibited Use
Fraudulent orders, misuse, reverse engineering, and manipulation are prohibited.

13. Data Privacy & Communications
Buyer data is handled as per SEMAMART Privacy Policy.

14. Limitation of Liability
Liability is limited to the platform fee charged for the transaction.

15. Modification of Terms
SEMAMART may update these Terms at any time.

16. Governing Law & Jurisdiction
Governed by applicable law. Jurisdiction: Courts as may be specified by SEMAMART.
`.trim();

      function renderParagraphsWithNumberedHeadings(text, x, width) {
        const lines = text.split(/\n/);
        const headingRe = /^\s*\d{1,2}\.\s+/;

        lines.forEach((raw) => {
          const line = raw.trim();
          if (!line) {
            doc.moveDown(0.4);
            return;
          }
          if (headingRe.test(line)) {
            ensureSpace(26);
            doc.font(FONT_BOLD).fontSize(11).fillColor(BRAND_TEAL);
            doc.text(line, x, doc.y, { width, align: "left", lineGap: 2 });
            doc.moveDown(0.2);
            doc.fillColor(TEXT_DARK);
          } else {
            ensureSpace(18);
            doc.font(FONT_REGULAR).fontSize(10).fillColor(TEXT_DARK);
            doc.text(line, x, doc.y, { width, align: "left", lineGap: 2 });
          }
        });
      }

      renderParagraphsWithNumberedHeadings(termsText, contentX, contentWidth);

      // Final page footer
      drawFooter(pageNumber);

      doc.end();

      writeStream.on("finish", () => resolve(`pdfs/${filename}`));
      writeStream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = generateUserPdf;
