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

      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        info: {
          Title: `User Registration - ${user.firstName} ${user.lastName}`,
          Author: "SEMA Healthcare Pvt. Ltd.",
        },
      });

      doc.pipe(writeStream);

      // Header (logo on left, title)
      const logoPath = path.join(process.cwd(), "public", "Logo-imag.png");
      if (fs.existsSync(logoPath)) {
        try { doc.image(logoPath, 40, 40, { width: 72 }); } catch (e) {}
      }
      doc.fontSize(18).fillColor("#0b5560").text("SEMA Healthcare Pvt. Ltd.", 120, 48);
      doc.moveDown(1);

      doc.fontSize(14).fillColor("#000").text("User Registration Snapshot", { align: "left" });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#444")
        .text(`User ID: ${user._id}`, { continued: true })
        .text(`    Created: ${formatDate(user.createdAt)}`, { align: "right" });
      doc.moveDown(1);

      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#E6E6E6").stroke();
      doc.moveDown(0.8);

      const leftX = 48;

      doc.fontSize(11).fillColor("#555").text("Name", leftX);
      doc.fontSize(13).fillColor("#000").text(`${user.firstName || ""} ${user.lastName || ""}`.trim() || "-", leftX);

      doc.moveDown(0.6);
      doc.fontSize(11).fillColor("#555").text("Email", leftX);
      doc.fontSize(13).fillColor("#000").text(user.email || "-", leftX);

      doc.moveDown(0.6);
      doc.fontSize(11).fillColor("#555").text("Phone", leftX);
      doc.fontSize(13).fillColor("#000").text(user.phoneNumber || "-", leftX);

      doc.moveDown(0.6);
      doc.fontSize(11).fillColor("#555").text("Institute", leftX);
      doc.fontSize(13).fillColor("#000").text(user.instituteName || "-", leftX);

      // Addresses (if any)
      if (Array.isArray(user.addresses) && user.addresses.length) {
        doc.moveDown(1);
        doc.fontSize(12).fillColor("#0b5560").text("Addresses", leftX);
        doc.moveDown(0.4);
        user.addresses.forEach((addr, idx) => {
          doc.fontSize(10).fillColor("#555").text(`${idx + 1}. ${addr.reciever_name} — ${addr.instituteAddress1}${addr.instituteAddress2 ? ", " + addr.instituteAddress2 : ""}`, { width: 480 });
          doc.fontSize(10).fillColor("#444").text(`   ${addr.district}, ${addr.state} - ${addr.pincode} | ${addr.phone}`, { width: 480 });
          doc.moveDown(0.3);
        });
      }

      doc.moveDown(1);
      doc.fontSize(10).fillColor("#666").text(
        "This document contains the submitted registration details. Passwords and sensitive auth data are not included."
      );

      doc.moveDown(2);
      doc.fontSize(9).fillColor("#999").text(`© ${new Date().getFullYear()} SEMA Healthcare Pvt. Ltd.`, { align: "center" });

      doc.end();

      writeStream.on("finish", () => {
  // IMPORTANT: match express static route
  resolve(`pdfs/${filename}`);
});

      writeStream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = generateUserPdf;
