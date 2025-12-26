const PDFDocument = require("pdfkit");
const path = require("path");

function generateInvoice(stream, order) {
     const doc = new PDFDocument({ size: "A4", margin: 30 });
     doc.pipe(stream);

     // --- 1. HEADER SECTION ---
     doc.fontSize(14)
          .font("Helvetica-Bold")
          .text("SEMA HEALTHCARE PRIVATE LIMITED");
     doc.fontSize(9)
          .font("Helvetica")
          .text(
               "317, 2nd floor, SS Plaza, Delhi-Palam Road, Mahavir Enclave, Delhi 110045",
          )
          .text("Phone: 01149082773 | Email: info@semamart.com");

     const logoPath = path.join(__dirname, "../assets/Logo-imag.png");
     doc.image(logoPath, 490, 20, { width: 70 });

     doc.moveDown();
     doc.rect(30, doc.y, 535, 0.5).stroke(); // Top horizontal line
     doc.moveDown();

     // --- 2. BILL TO & INVOICE DETAILS ---
     const topOfDetails = doc.y;
     doc.fontSize(10).font("Helvetica-Bold").text("BILL TO", 40, topOfDetails);
     doc.font("Helvetica")
          .text(`Company: ${order.user?.instituteName}`, 40, doc.y + 1)
          .text(
               `Shipping: ${order.shippingAddress?.instituteAddress1}`,
               40,
               doc.y + 2,
          )
          .text(`${order.shippingAddress?.instituteAddress2}`, 40, doc.y + 3)
          .text(
               `${order.shippingAddress?.district}, ${order.shippingAddress?.state}, ${order.shippingAddress?.pincode}`,
               40,
               doc.y + 4,
          );

     doc.font("Helvetica-Bold").text("BILL DETAILS", 400, topOfDetails);
     doc.font("Helvetica").text(
          `Tax Invoice No: ${order._id.toString().slice(-6).toUpperCase()}`,
          400,
          doc.y + 1,
     );
     doc.font("Helvetica").text(
          `Date: ${new Date().toLocaleDateString("en-IN")}`,
          400,
          doc.y + 2,
     );
     doc.text(`GSTIN: ${order.shop.gstNumber}`, 400, doc.y + 3);

     doc.moveDown(4);

     // --- 3. PRODUCT TABLE ---
     const tableTop = doc.y;
     // Updated colWidths to match SEMA's detailed table
     const colWidths = [200, 80, 60, 80, 60, 80];
     const headers = [
          "Product Details",
          "HSN",
          "QTY",
          "Price",
          "GST%",
          "Amount",
     ];

     // Header Background
     doc.rect(30, tableTop, 535, 20)
          .fill("#f0f0f0")
          .strokeColor("#000")
          .stroke();
     doc.fillColor("#000").font("Helvetica-Bold").fontSize(9);

     let currentX = 30;
     headers.forEach((h, i) => {
          doc.text(h, currentX + 2, tableTop + 6, {
               width: colWidths[i],
               // align: "center",
          });
          currentX += colWidths[i];
     });

     // Row Data
     let rowY = tableTop + 20;
     const item = {
          name: order.variant.productId?.name, //
          hsn: order.variant.productId?.hsn,
          qty: order.qty,
          price: order.unitPrice,
          gst: order.tax,
          total: order.totalPrice,
     };

     // Draw Data Row
     doc.font("Helvetica").fontSize(8);
     doc.rect(30, rowY, 535, 30).stroke(); // Cell borders

     doc.text(item.name, 35, rowY + 5, { width: colWidths[1] });
     doc.text(item.hsn, 220, rowY + 5, { width: colWidths[2] });
     doc.text(item.qty.toString(), 320, rowY + 5, {
          width: colWidths[3],
     });
     doc.text(item.price.toFixed(2), 360, rowY + 5, {
          width: colWidths[4],
     });
     doc.text(item.gst, 460, rowY + 5, {
          width: colWidths[5],
     });
     doc.text(item.total.toFixed(2), 510, rowY + 5, {
          width: colWidths[6],
     });

     // Totals Box (Right)
     let footerY = doc.y + 16;
     doc.rect(380, footerY, 185, 60).stroke();
     doc.text("Sub Total:", 385, footerY + 5).text(
          order.unitPrice * order.qty,
          480,
          footerY + 5,
          { align: "right", width: 80 },
     );
     doc.text(`IGST @ ${order.tax}:`, 385, footerY + 20).text(
          (order.unitPrice * order.tax * order.qty) / 100,
          480,
          footerY + 20,
          { align: "right", width: 80 },
     );
     doc.font("Helvetica-Bold")
          .text("GRAND TOTAL:", 385, footerY + 35)
          .text(order.totalPrice, 480, footerY + 35, {
               align: "right",
               width: 80,
          });

     // --- 5. TERMS & WARRANTY ---
     let totalsY = doc.y + 40;
     footerY = totalsY;
     const colWidth = 260;

     // LEFT COLUMN: Terms and Conditions
     doc.fontSize(9)
          .font("Helvetica-Bold")
          .text("Terms and Conditions:", 30, footerY); // [cite: 25]
     doc.font("Helvetica").fontSize(7).fillColor("#333");

     const terms = [
          "1. Goods once sold will not be accepted back.", // [cite: 34]
          "2. All dispute Subject to Delhi Jurisdiction.", // [cite: 36]
          "3. Freight Charges will be extra.", // [cite: 40]
          "4. Delivery Period will be 7 working days.", // [cite: 41]
          "5. Payment once received cannot be refunded, it can be adjusted with next order.", // [cite: 42]
          "6. Claim of shortage if any must be intimated within 24 hours.", // [cite: 38]
          "7. Standard packing cost included only.", // [cite: 43]
          "8. Bank Charges (fee) must be paid by buyer.", // [cite: 44]
          "9. Payment terms 100% advance payment with confirm Irrevocable order.", // [cite: 45]
     ];

     let termY = footerY + 15;
     terms.forEach((term) => {
          doc.text(term, 30, termY, { width: colWidth, lineGap: 2 });
          termY = doc.y;
     });

     const rightColX = 450;
     doc.fillColor("#000")
          .fontSize(9)
          .font("Helvetica-Bold")
          .text("Pay To:", rightColX, footerY);
     doc.font("Helvetica")
          .fontSize(8)
          .text(
               `In Favour: ${order.shop.businessName || "Sema Healthcare Pvt Ltd"}`,
               rightColX,
               footerY + 15,
          )
          .text(
               `A/C Number: ${order.shop.accountNumber || "97863700000408"}`,
               rightColX,
          )
          .text(`IFSC: ${order.shop.ifsc || "YESB0000978"}`, rightColX)
          .text(`Bank Name: ${order.shop.bankName || "Yes Bank"}`, rightColX);

     doc.moveDown(3);

     doc.rect(30, doc.y+30, 535, 0.5).stroke();
     doc.font("Helvetica-Bold").text("For Sema Healthcare Private Limited", 30, doc.y+40);
     doc.moveDown(2);
     doc.text("Authorised Signatory", 30);

     doc.end();
}

module.exports = { generateInvoice };
