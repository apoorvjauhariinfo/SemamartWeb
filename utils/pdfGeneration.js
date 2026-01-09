const PDFDocument = require("pdfkit");
const path = require("path");

function generateInvoice(stream, order) {
    const doc = new PDFDocument({ size: "A4", margin: 30 });
    doc.pipe(stream);

    drawHeader(doc, order);
    drawBuyerSellerBox(doc, order);
    drawItemsTable(doc, order);
    drawFooter(doc);

    doc.end();
}

function drawHeader(doc, order) {
    doc.fontSize(12)
        .font("Helvetica-Bold")
        .text("SEMA HEALTHCARE PRIVATE LIMITED", 20, 10);
    doc.fontSize(8)
        .font("Helvetica")
        .text(
            "317, 2nd floor, SS Plaza, Delhi-Palam Road, Mahavir Enclave, Delhi 110045",
        )
        .text("Phone: 01149082773 | Email: info@semamart.com");

    const logoPath = path.join(__dirname, "../assets/Logo-imag.png");
    doc.image(logoPath, 520, 10, { width: 50 });

    doc.fontSize(11).font("Helvetica-Bold").text("Proforma Invoice", 40, 50, {
        align: "center",
    });

    doc.font("Helvetica");

    const businessName = order.shop.businessName;
    const gst = order.shop.gstNumber;
    const phone = order.shop.phoneNumber;
    const add = order.shop.address;

    doc.rect(50, 65, 500, 60)
        .stroke()
        .fontSize(11)
        .text(businessName, 60, 70)
        .fontSize(9)
        .text("GST: " + gst)
        .text("Phone: " + phone)
        .text(add);

    doc.rect(300, 65, 250, 30)
        .stroke()
        .rect(300, 65, 125, 60)
        .stroke()
        .fontSize(9)
        .text(`Quotation No:\n${order._id}`, 305, 70)
        .text(
            `Date:\n${new Date(order.createdAt).toLocaleDateString("en-IN")}`,
            430,
            70,
        )
        .text("Mode/Terms of payment:", 430, 100)
        .fontSize(10)
        .text("100% advance payment");
}

function drawBuyerSellerBox(doc, order) {
    const y = 125;
    const name = order.user?.instituteName;
    const add1 = order.shippingAddress?.instituteAddress1;
    const add2 = order.shippingAddress?.instituteAddress2;
    const add3 = `${order.shippingAddress?.district}, ${order.shippingAddress?.state}, ${order.shippingAddress?.pincode}`;
    const phone = order.shippingAddress?.phone;
    const invoiceName = order.user?.firstName + order.user?.lastName;

    doc.rect(50, y, 250, 140).stroke();
    doc.rect(300, y, 250, 140).stroke();

    doc.fontSize(8)
        .text("Dispatch To:", 60, y + 5)
        .fontSize(10)
        .text(invoiceName)
        .text(name)
        .text(add1)
        .text(add2)
        .text(add3)
        .text("Phone no.: " + phone);

    doc.rect(50, y + 85, 250, 55).stroke();
    const invoiceInstituteName = name;
    const email = order.user?.email;

    doc.fontSize(8)
        .text("Invoice To:", 60, y + 90)
        .fontSize(10)
        // .text(invoiceName)
        .text(invoiceInstituteName)
        .text(email);

    doc.rect(300, y, 125, 30).stroke();
    doc.rect(425, y, 125, 30).stroke();
    doc.fontSize(8)
        .text("Despatch through", 310, 130)
        .text("Destination", 435, 130);
    // .text("Terms of Delivery", 310, 160);
}

function drawItemsTable(doc, order) {
    const item = [
        { text: order.variant.productId?.name, font: { size: 11 } },
        { text: order.variant.productId?.hsn, align: { x: "center" } },
        { text: order.tax + " %", align: { x: "center" } },
        { text: order.qty, align: { x: "center" } },
        { text: order.unitPrice, align: { x: "center" } },
        { text: order.unitPrice * order.qty, align: { x: "right" } },
    ];

    doc.table({
        columnStyles: [200, 60, 60, 60, 60, 60],
        rowStyles: [20, 200],
        data: [
            [
                { text: "Product Details", align: { x: "center" } },
                { text: "HSN", align: { x: "center" } },
                { text: "Tax", align: { x: "center" } },
                { text: "QTY", align: { x: "center" } },
                { text: "Price", align: { x: "center" } },
                { text: "Amount", align: { x: "center" } },
            ],
            item,
        ],
        position: { x: 50, y: 265 },
    });

    doc.text("GST Output", 205, 320);
    doc.text(order.totalPrice - order.unitPrice * order.qty, 520, 320);

    doc.rect(50, 455, 500, 30).stroke();
    doc.fontSize(11).text("Total", 220, 460);
    doc.fontSize(9).text(
        new Intl.NumberFormat("en-IN").format(order.totalPrice),
        492,
        460,
    );
    doc.rect(50, 485, 500, 150).stroke();
}

function drawFooter(doc, order) {
    doc.fontSize(8).text("For Sema Healthcare Private Limited", 400, 550);
    doc.text("Authorised Signatory", 455, 610);
}

module.exports = { generateInvoice };
