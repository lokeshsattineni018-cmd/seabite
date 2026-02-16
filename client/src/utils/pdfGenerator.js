import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoicePDF = (order) => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    // ----- Header: Brand & Invoice Info -----
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont("helvetica", "bold");
    doc.text("SEABITE", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFont("helvetica", "normal");
    doc.text("The premium seafood experience", 14, 28);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 150, 22);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`ID: #${order.orderId || order._id.substring(0, 8)}`, 150, 28);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 150, 33);
    doc.text(`Status: ${order.status.toUpperCase()}`, 150, 38);

    // ----- Horizontal Line -----
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.line(14, 45, 196, 45);

    // ----- Billing & Shipping -----
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("BILLED TO", 14, 55);
    doc.text("SHIPPING TO", 100, 55);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85); // slate-700

    // Bill to (User)
    doc.text(order.user?.name || "Customer", 14, 62);
    doc.text(order.user?.email || "", 14, 67);

    // Ship to (Address)
    const addr = order.shippingAddress;
    doc.text(`${addr.fullName}`, 100, 62);
    doc.text(`${addr.houseNo}, ${addr.street}`, 100, 67);
    doc.text(`${addr.city}, ${addr.state} - ${addr.zip}`, 100, 72);
    doc.text(`Phone: ${addr.phone}`, 100, 77);

    // ----- table: Line Items -----
    const tableRows = order.items.map((item) => [
        item.name,
        `INR ${item.price.toLocaleString()}`,
        item.qty.toString(),
        `INR ${(item.price * item.qty).toLocaleString()}`,
    ]);

    autoTable(doc, {
        startY: 85,
        head: [["Description", "Price", "Qty", "Total"]],
        body: tableRows,
        theme: "striped",
        headStyles: {
            fillColor: [15, 23, 42], // slate-900 
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: "bold",
            halign: "left"
        },
        bodyStyles: {
            fontSize: 9,
            textColor: [51, 65, 85],
        },
        columnStyles: {
            3: { halign: "right", fontStyle: "bold" },
        },
        margin: { left: 14, right: 14 },
    });

    // ----- Summary -----
    const finalY = doc.previousAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);

    const summaryX = 140;
    doc.text("Subtotal:", summaryX, finalY);
    doc.text("Tax (5%):", summaryX, finalY + 6);
    doc.text("Shipping:", summaryX, finalY + 12);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`INR ${order.itemsPrice.toLocaleString()}`, 196, finalY, { align: "right" });
    doc.text(`INR ${order.taxPrice.toLocaleString()}`, 196, finalY + 6, { align: "right" });
    doc.text(`INR ${order.shippingPrice.toLocaleString()}`, 196, finalY + 12, { align: "right" });

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(summaryX, finalY + 16, 196, finalY + 16);

    doc.setFontSize(12);
    doc.text("GRAND TOTAL:", summaryX, finalY + 24);
    doc.text(`INR ${order.totalAmount.toLocaleString()}`, 196, finalY + 24, { align: "right" });

    // ----- Footer -----
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Thank you for choosing SeaBite. This is a computer generated document.", 105, 280, { align: "center" });

    // Save the PDF
    doc.save(`Invoice_SeaBite_${order.orderId || order._id.substring(0, 8)}.pdf`);
};
