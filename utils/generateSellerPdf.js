// backend/utils/generateSellerPdf.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function formatDate(d) {
  try { return new Date(d).toLocaleDateString("en-GB"); } catch (e) { return ""; }
}

// ---------------------- EXACT CONTENT (unchanged except vendor placeholder) ----------------------
const TOC_BLOCK = `
TABLE OF CONTENTS
Purpose
Vendor Obligations
Company Obligations
Term and Termination
Warranties
Returns
Confidentiality
Fees and Payments
Intellectual Property
Indemnity
Limitation of Liability
Force Majeure
Relationship of the Parties
Governing Law and Dispute Resolution
Miscellaneous Provisions
Annexure A: Return Policy
`.trim();

const AGREEMENT_BODY = `
VENDOR AGREEMENT
This Vendor Agreement ("Agreement") is made and entered into on the Effective Date, by and between:

Sema Healthcare Private Limited, a company incorporated under the Companies Act, 2013, having its registered office at Mahavir Enclave, Delhi, India, hereinafter referred to as the "Company", which owns and operates the business-to-business (B2B) digital commerce platform known as "Semamart";

{{VENDOR_DECLARATION}}

Collectively referred to as the "Parties" and individually as a "Party".

WHEREAS the purpose of this Agreement is to establish and regulate the terms and conditions under which the Vendor shall be permitted to list, display, market, and sell its products on the Semamart platform, and to outline the respective obligations of the Vendor and the Company in connection with such sale, including delivery, return, post-sale support, dispute resolution, and financial settlements.

NOW, THEREFORE, IN ORDER TO SUBSTANTIATE AND RECORD THE TERMS AND CONDITIONS OF THIS AGREEMENT AND IN CONSIDERATION OF THE MUTUAL COVENANTS AND FOR OTHER GOOD VALUABLE CONSIDERATION, THE PARTIES AGREE AS FOLLOWS:

1. VENDOR OBLIGATIONS
1.1 The Vendor agrees to comply with all applicable laws including GST, Legal Metrology Act, and Drugs & Cosmetics Act.

1.2 The Vendor shall maintain accurate product listings including pricing, taxes, batch and expiry details.

1.3 The Vendor shall ensure products are genuine and meet quality standards.

1.4 The Vendor is responsible for inventory availability and timely fulfilment.

1.5 The Vendor shall provide post-sale support including returns and warranties.

1.6 Returns for defective, expired, counterfeit or damaged products must be honoured within 7 days.

1.7 Vendor shall maintain all licenses and approvals required for sale.

1.8 Vendor accepts full liability for product compliance.

1.9 Vendor shall not list prohibited or misleading products.

2. COMPANY OBLIGATIONS
2.1 The Company shall provide platform access and seller tools.

2.2 The Company acts solely as a facilitator.

2.3 Optional services may be provided separately.

3. TERM & TERMINATION
3.1 Agreement valid for one (1) year and auto-renews.

3.2 Either Party may terminate with 30 days notice.

3.3 Immediate termination in case of breach or fraud.

3.4 Pending orders must be fulfilled post termination.

4. WARRANTIES
The Vendor warrants authority, accuracy of information, and non-infringement.

5. RETURNS
Vendor shall process refunds or replacements within 7 business days. Return shipping borne by Vendor.

6. CONFIDENTIALITY
Confidential information must be protected for 3 years post termination.

7. FEES & PAYMENTS
Payments settled within 3 working days after confirmation. Taxes borne by Vendor.

8. INTELLECTUAL PROPERTY
Vendor grants license to use branding and product content.

9. INDEMNITY
Vendor indemnifies Company against losses from defects, violations or infringement.

10. LIMITATION OF LIABILITY
Company liability limited to fees earned in preceding one (1) month.

11. FORCE MAJEURE
No liability for events beyond reasonable control.

12. RELATIONSHIP OF PARTIES
Principal-to-principal relationship only.

13. GOVERNING LAW & DISPUTE RESOLUTION
Indian law applies. Jurisdiction: Courts of Delhi. Arbitration applicable.

14. MISCELLANEOUS
Entire agreement, amendments only in writing, notices via registered channels.

ANNEXURE A: RETURN POLICY
1. Return Eligibility: Defective, expired, incorrect, or damaged goods

2. Return Window: [7–15 days from delivery date]

3. Conditions: Product must be unused, in original packaging

4. Refund/Replacements: Within [7 business days] of approval
`.trim();
// -------------------- end exact content --------------------------------

// -------------------- style & layout constants --------------------
const FONT_REGULAR = "Helvetica";
const FONT_BOLD = "Helvetica-Bold";

// Brand colors from Semamart logo
const BRAND_ORANGE = "#F9A11B";
const BRAND_TEAL = "#1C6C84";
const BRAND_BLUE = "#1F4F99";

const BORDER_COLOR = "#E6E6E6";
const MUTED = "#6B7280";
const BODY_COLOR = "#0F1724"; // used for body text
const BLACK = "#000000";

const logoPath = path.join(process.cwd(), "assets", "logo.png");

// Build cover block from seller object
function createCoverBlock(seller) {
  const vendorName = (seller && (seller.businessName || `${(seller.firstName || "").trim()} ${(seller.lastName || "").trim()}`.trim())) || seller && seller._id || "Vendor";
  const vendorType = (seller && (seller.businessType || "Manufacturer")) || "Manufacturer";

  const owner = [(seller && seller.firstName), (seller && seller.lastName)].filter(Boolean).join(" ").trim() || "-";
  const gst = seller && seller.gstNumber ? seller.gstNumber : "-";
  const email = seller && seller.email ? seller.email : "-";
  const phone = seller && seller.phoneNumber ? seller.phoneNumber : "-";

  const locationParts = [
    seller && seller.district,
    seller && seller.state
  ].filter(Boolean);

  if (!locationParts.length) {
    const fallbackAddr = seller && (seller.registeredAddress || seller.address || seller.fullAddress || seller.shopAddress || seller.location);
    if (fallbackAddr) locationParts.push(fallbackAddr);
  }

  const vendorLocation = locationParts.length ? locationParts.join(", ") : "-";
  const effective = formatDate((seller && seller.createdAt) || new Date());

  const lines = [
    `Between`,
    ``,
    `Sema Healthcare Private Limited`,
    `(Registered under the Companies Act, 2013)`,
    `Having its registered office at:`,
    `317, 2nd Floor, SS Plaza, Delhi-Palam Road,`,
    `Mahavir Enclave, Delhi 110045`,
    `(Hereinafter referred to as the “Company” or “Semamart”)`,
    ``,
    `AND`,
    ``,
    `${vendorName}`,
    `${vendorType}`,
    `Having its principal place of business at:`,
    `${vendorLocation}`,
    ``,
    `Owner: ${owner}`,
    `GST: ${gst}`,
    `Contact: Email: ${email} | Phone: ${phone}`,
    ``,
    `Effective Date: ${effective}`
  ];

  return lines.join("\n").trim();
}

// Build the vendor declaration line(s) used inside AGREEMENT_BODY
function buildVendorDeclaration(seller) {
  const sellerName = (seller && (seller.businessName ||
    `${(seller.firstName || "").trim()} ${(seller.lastName || "").trim()}`.trim())) || "vj";
  const vendorType = (seller && (seller.businessType || "Manufacturer")) || "Manufacturer";

  // Prefer district + state, fallback to available address fields
  const district = (seller && (seller.district || seller.city)) || "";
  const state = (seller && seller.state) || "";
  let locationParts = [district, state].filter(Boolean);
  if (!locationParts.length) {
    const fallbackAddr = seller && (seller.registeredAddress || seller.address || seller.fullAddress || seller.shopAddress || seller.location);
    if (typeof fallbackAddr === "string" && fallbackAddr.trim()) {
      locationParts = [fallbackAddr.trim()];
    } else if (fallbackAddr && typeof fallbackAddr === "object") {
      const addrParts = [
        fallbackAddr.instituteAddress1,
        fallbackAddr.instituteAddress2,
        fallbackAddr.district,
        fallbackAddr.state,
        fallbackAddr.pincode
      ].filter(Boolean);
      if (addrParts.length) locationParts = addrParts;
    }
  }
  const vendorLocation = locationParts.length ? locationParts.join(", ") : "-";

  // produce sentence similar to original
  const declaration = `AND ${sellerName}, a ${vendorType} duly registered and having its principal place of business at ${vendorLocation}, hereinafter referred to as the "Vendor".`;
  return declaration;
}

async function generateSellerPdf(seller) {
  return new Promise((resolve, reject) => {
    try {
      const pdfDir = path.join(process.cwd(), "uploads", "pdfs");
      if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

      const filename = `${seller._id}.pdf`;
      const filePath = path.join(pdfDir, filename);
      const writeStream = fs.createWriteStream(filePath);

      // IMPORTANT: left/right margins preserved; top/bottom set to 0 so header/footer can be flush
      const doc = new PDFDocument({
        size: "A4",
        margin: { top: 0, bottom: 0, left: 40, right: 40 },
        info: { Title: `Seller Agreement - ${seller && (seller.businessName || seller._id) || "seller"}` }
      });

      // Layout variables (match user PDF)
      const FONT_REG = FONT_REGULAR;
      const FONT_BD = FONT_BOLD;
      const BRAND_ORG = BRAND_ORANGE;
      const BRAND_TL = BRAND_TEAL;
      const TEXT_DK = BODY_COLOR;
      const MUTED_COLOR = MUTED;

      const PAGE_MARGIN = doc.page.margins.left || 40;
      const contentX = PAGE_MARGIN + 20;
      const contentWidth = doc.page.width - PAGE_MARGIN * 2 - 40;
      const HEADER_HEIGHT = 86;
      const FOOTER_HEIGHT = 64;

      let pageNumber = 1;

      // ---------- Header (copied from generateUserPdf) ----------
      function drawHeader() {
        const pageW = doc.page.width;
        const headerY = 0;
        const headerH = HEADER_HEIGHT;

        doc.save();

        // header background (white) — keeps it flush to the top
        doc.rect(0, headerY, pageW, headerH).fill("#FFFFFF");

        // top accent line (teal)
        doc.strokeColor(BRAND_TL).lineWidth(3);
        doc.moveTo(0, headerY + 6).lineTo(pageW, headerY + 6).stroke();

        // bottom accent line (orange)
        doc.strokeColor(BRAND_ORG).lineWidth(3);
        doc.moveTo(0, headerY + headerH - 6).lineTo(pageW, headerY + headerH - 6).stroke();

        // logo centered inside header
        const logoMaxWidth = 180;
        const logoY = headerY + 18;
        const logoX = (pageW - logoMaxWidth) / 2;

        if (fs.existsSync(logoPath)) {
          try {
            doc.image(logoPath, logoX, logoY, { width: logoMaxWidth });
          } catch (e) {
            // fallback dot if logo fails
            doc.circle(pageW / 2, logoY + 20, 10).fill(BRAND_ORG);
          }
        } else {
          doc.circle(pageW / 2, logoY + 20, 10).fill(BRAND_ORG);
        }

        // Decorative tiny diagonal marks (same as user PDF)
        const dX = pageW - 72;
        const dY = headerY + 22;

        doc.strokeColor(BRAND_TL).lineWidth(1.2);
        doc.moveTo(dX, dY).lineTo(dX + 16, dY + 16).stroke();

        doc.strokeColor(BRAND_ORG).lineWidth(1.2);
        doc.moveTo(dX + 8, dY).lineTo(dX + 24, dY + 16).stroke();

        // Set content start after header
        doc.x = contentX;
        doc.y = headerY + headerH + 12;

        doc.restore();
      }

      // ---------- Footer (copied from generateUserPdf) ----------
      function drawFooter(pgNum) {
        try {
          const footerTopY = doc.page.height - FOOTER_HEIGHT + 8;
          const footerWidth = doc.page.width;
          const left = 0;

          doc.save();
          doc.font(FONT_REG).fontSize(9).fillColor(MUTED_COLOR);

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
        doc.fillColor(TEXT_DK);
        doc.font(FONT_REG);
        doc.fontSize(10);
      });

      // Draw first page header
      drawHeader();
      doc.fillColor(TEXT_DK);
      doc.font(FONT_REG);
      doc.fontSize(10);

      // ---------- COVER BLOCK (centered & black) ----------
      doc.font(FONT_BD).fontSize(18).fillColor(BLACK);
      doc.text("VENDOR AGREEMENT", contentX, doc.y, { align: "center", width: contentWidth });
      doc.moveDown(0.6);

      // Render cover block lines centered and in black
      doc.font(FONT_REG).fontSize(10).fillColor(BLACK);
      const coverText = createCoverBlock(seller || {});
      const coverLines = coverText.split("\n").filter(Boolean);
      coverLines.forEach((ln) => {
        ensureSpace(18);
        doc.text(ln.trim(), contentX, doc.y, { width: contentWidth, align: "center" });
        doc.moveDown(0.12);
      });

      // A divider line before TOC (maintain left/right margins)
      doc.moveDown(0.4);
      doc.moveTo(PAGE_MARGIN + 8, doc.y).lineTo(doc.page.width - PAGE_MARGIN - 8, doc.y).strokeColor(BORDER_COLOR).lineWidth(0.5).stroke();
      doc.moveDown(0.4);

      // ---------- TABLE OF CONTENTS (left aligned, normal body color) ----------
      doc.font(FONT_BD).fontSize(13).fillColor(BRAND_TL);
      doc.text("TABLE OF CONTENTS", contentX, doc.y, { width: contentWidth, align: "left" });
      doc.moveDown(0.4);

      doc.font(FONT_REG).fontSize(10).fillColor(BODY_COLOR);
      const tocLines = TOC_BLOCK.split("\n").slice(1).map(l => l.trim()).filter(Boolean);
      tocLines.forEach((item, idx) => {
        const num = idx + 1;
        const text = `${num}. ${item}`;
        doc.text(text, contentX, doc.y, { width: contentWidth - 12, lineGap: 2 });
        doc.moveDown(0.12);
      });

      doc.moveDown(0.35);
      doc.moveTo(PAGE_MARGIN + 8, doc.y).lineTo(doc.page.width - PAGE_MARGIN - 8, doc.y).strokeColor("#F0F0F0").lineWidth(0.5).stroke();

      // Add new page for agreement body (clean TOC page)
      drawFooter(pageNumber);
      doc.addPage();

      // ---------- AGREEMENT BODY (left-aligned, headings teal) ----------
      const SECTION_X = contentX;
      const SUB_X = SECTION_X + 16;
      doc.font(FONT_REG).fontSize(10).fillColor(BODY_COLOR);

      function ensureSpaceBody(h = 60) {
        if (doc.y + h > doc.page.height - doc.page.margins.bottom - 60) {
          doc.addPage();
        }
      }

      // Fill the vendor declaration placeholder in AGREEMENT_BODY with seller-specific text
      const vendorDeclaration = buildVendorDeclaration(seller || {});
      const filledAgreement = AGREEMENT_BODY.replace('{{VENDOR_DECLARATION}}', vendorDeclaration);

      const bodyLines = filledAgreement.split("\n");

      bodyLines.forEach((raw) => {
        const ln = raw.trim();
        if (!ln) {
          doc.moveDown(0.5);
          return;
        }

        // Top-level numbered heading (e.g., "1. VENDOR OBLIGATIONS")
        if (/^\d+\.\s+/.test(ln)) {
          ensureSpace(36);
          doc.font(FONT_BD).fontSize(12).fillColor(BRAND_TL);
          doc.text(ln, SECTION_X, doc.y, { width: contentWidth, align: "left" });
          doc.moveDown(0.2);
          // revert to body style
          doc.font(FONT_REG).fontSize(10).fillColor(BODY_COLOR);
          return;
        }

        // Subpoint like "1.1 ..."
        if (/^\d+\.\d+\s+/.test(ln)) {
          ensureSpace(26);
          doc.font(FONT_REG).fontSize(10).fillColor(BODY_COLOR);
          doc.text(ln, SUB_X, doc.y, { width: contentWidth - 16, align: "left", lineGap: 3 });
          doc.moveDown(0.12);
          return;
        }

        // Normal paragraph
        ensureSpace(36);
        doc.font(FONT_REG).fontSize(10).fillColor(BODY_COLOR);
        doc.text(ln, SECTION_X, doc.y, { width: contentWidth, align: "justify", lineGap: 3 });
        doc.moveDown(0.12);
      });

      // draw footer for final page
      try {
        drawFooter(pageNumber);
      } catch (e) { /* ignore */ }

      // finalize
      doc.end();

      writeStream.on("finish", () => resolve(`pdfs/${filename}`));
      writeStream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = generateSellerPdf;
