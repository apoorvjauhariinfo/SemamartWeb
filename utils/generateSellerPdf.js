const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function formatDate(d) {
  try { return new Date(d).toLocaleString("en-IN"); } catch (e) { return ""; }
}

/**
 * Generates a seller registration PDF using pdfkit.
 * @param {Object} seller - mongoose seller document (must include _id, firstName, lastName, businessName, etc.)
 * @returns {Promise<string>} - resolves to the relative file path (e.g. 'uploads/pdfs/<id>.pdf')
 */
async function generateSellerPdf(seller) {
  return new Promise((resolve, reject) => {
    try {
      // ensure upload folder exists
      const pdfDir = path.join(process.cwd(), "uploads", "pdfs");
      if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

      const filename = `${seller._id}.pdf`;
      const filePath = path.join(pdfDir, filename);
      const writeStream = fs.createWriteStream(filePath);

      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        info: {
          Title: `Seller Registration - ${seller.businessName}`,
          Author: "SEMA Healthcare Pvt. Ltd.",
        },
      });

      doc.pipe(writeStream);

      // Header
      const logoPath = path.join(process.cwd(), "public", "Logo-imag.png"); // adjust if logo path differs
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 40, { width: 72 });
      }
      doc.fontSize(18).fillColor("#0b5560").text("SEMA Healthcare Pvt. Ltd.", 120, 48);
      doc.moveDown(1);

      // Title & metadata
      doc.fontSize(14).fillColor("#000").text("Seller Registration Snapshot", { align: "left" });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#444")
        .text(`Seller ID: ${seller._id}`, { continued: true })
        .text(`    Created: ${formatDate(seller.createdAt)}`, { align: "right" });
      doc.moveDown(1);

      // Horizontal rule
      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#E6E6E6").stroke();
      doc.moveDown(0.8);

      // Left column: business + owner details
      const startY = doc.y;
      const leftX = 48;
      const rightX = 320;

      doc.fontSize(11).fillColor("#555").text("Business Name", leftX, startY);
      doc.fontSize(13).fillColor("#000").text(seller.businessName || "-", leftX, doc.y + 2);

      doc.moveDown(0.6);
      doc.fontSize(11).fillColor("#555").text("Owner", leftX);
      doc.fontSize(13).fillColor("#000").text(`${seller.firstName || ""} ${seller.lastName || ""}`.trim() || "-", { continued: false });

      doc.moveDown(0.6);
      doc.fontSize(11).fillColor("#555").text("Business Type", leftX);
      doc.fontSize(13).fillColor("#000").text(seller.businessType || "-", { continued: false });

      doc.moveDown(0.6);
      doc.fontSize(11).fillColor("#555").text("GST Number", leftX);
      doc.fontSize(13).fillColor("#000").text(seller.gstNumber || "-", { continued: false });

      doc.moveDown(0.6);
      doc.fontSize(11).fillColor("#555").text("Contact", leftX);
      doc.fontSize(12).fillColor("#000").text(`Email: ${seller.email || "-"}`);
      doc.text(`Phone: ${seller.phoneNumber || "-"}`);

      // Right column: images and notes
      // Profile picture (use uploads/images/<filename>)
      const imagesBase = path.join(process.cwd(), "uploads", "images");
      const profilePath = seller.profilePic ? path.join(imagesBase, seller.profilePic) : null;
      const bannerPath = seller.banner ? path.join(imagesBase, seller.banner) : null;

      let imgY = startY;
      const imgX = rightX;

      if (profilePath && fs.existsSync(profilePath)) {
        try {
          doc.image(profilePath, imgX, imgY, { fit: [140, 140], align: "center", valign: "center" });
        } catch (err) {
          // skip if image fails
        }
      } else {
        // placeholder box
        doc.rect(imgX, imgY, 140, 90).strokeColor("#ddd").stroke();
        doc.fontSize(10).fillColor("#aaa").text("No profile image", imgX + 10, imgY + 38);
      }

      imgY += 100;
      if (bannerPath && fs.existsSync(bannerPath)) {
        try {
          doc.image(bannerPath, imgX, imgY, { fit: [140, 60], align: "center", valign: "center" });
        } catch (err) {
          // skip
        }
      }

      // Section: Notes / disclaimer
      doc.moveDown(7);
      doc.fontSize(10).fillColor("#666").text(
        "This document contains the submitted registration details. For security reasons passwords are not included. " +
        "If you suspect any issue with this registration, contact admin."
      );

      // Footer
      doc.moveDown(2);
      doc.fontSize(9).fillColor("#999").text(`© ${new Date().getFullYear()} SEMA Healthcare Pvt. Ltd.`, { align: "center" });

      // Finalize
      doc.end();

      writeStream.on("finish", () => {
  // IMPORTANT: match express static route
  resolve(`pdfs/${filename}`);
});


      writeStream.on("error", (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = generateSellerPdf;
