import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const getBase64ImageFromURL = (url) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.setAttribute("crossOrigin", "anonymous");
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL("image/png");
            resolve(dataURL);
        };
        img.onerror = () => {
            // console.warn("Logo load failed");
            resolve(null); // Continue without logo
        };
    });
};

export const generateInvoicePDF = async (order) => {
    const doc = new jsPDF();

    // Add Logo
    try {
        const logoData = await getBase64ImageFromURL("/round-logo.png");
        if (logoData) {
            doc.addImage(logoData, "PNG", 14, 10, 25, 25); // x, y, w, h
        }
    } catch (e) {
        // console.error("Logo Error", e);
    }

    // ----- Header: Brand & Invoice Info -----
    doc.setFontSize(24);
    doc.setTextColor(26, 43, 53); // textDark
    doc.setFont("helvetica", "bold");
    doc.text("SeaBite", 14, 42);

    doc.setFontSize(10);
    doc.setTextColor(74, 101, 114); // textMid
    doc.setFont("helvetica", "normal");
    doc.text("Fresh Coastal Catch", 14, 48);

    doc.setFontSize(12);
    doc.setTextColor(26, 43, 53);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 150, 22);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`ID: #${order.orderId || order._id.substring(0, 8).toUpperCase()}`, 150, 28);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 150, 33);
    doc.text(`Status: ${order.status}`, 150, 38);

    // ----- Horizontal Line -----
    doc.setDrawColor(226, 238, 236); // border
    doc.line(14, 55, 196, 55);

    // ----- Billing & Shipping -----
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 43, 53);
    doc.text("BILL TO", 14, 65);
    doc.text("SHIP TO", 100, 65);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(74, 101, 114); // textMid

    // Bill to (User)
    doc.text(order.user?.name || "Customer", 14, 72);
    doc.text(order.user?.email || "", 14, 77);

    // Ship to (Address)
    const addr = order.shippingAddress || {};
    doc.text(`${addr.fullName || ""}`, 100, 72);
    doc.text(`${addr.houseNo || ""}, ${addr.street || ""}`, 100, 77);
    doc.text(`${addr.city || ""}, ${addr.state || ""} - ${addr.zip || ""}`, 100, 82);
    doc.text(`Phone: ${addr.phone || ""}`, 100, 87);

    // ----- table: Line Items -----
    if (!order.items || !Array.isArray(order.items)) {
        order.items = [];
    }
    const tableRows = order.items.map((item) => [
        item.name,
        `Rs. ${item.price.toLocaleString()}`,
        item.qty.toString(),
        `Rs. ${(item.price * item.qty).toLocaleString()}`,
    ]);

    autoTable(doc, {
        startY: 95,
        head: [["Description", "Price", "Qty", "Total"]],
        body: tableRows,
        theme: "grid",
        headStyles: {
            fillColor: [91, 168, 160], // #5BA8A0 Primary
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: "bold",
            halign: "left"
        },
        bodyStyles: {
            fontSize: 9,
            textColor: [74, 101, 114], // textMid
            lineColor: [226, 238, 236], // border
        },
        columnStyles: {
            3: { halign: "right", fontStyle: "bold" },
            1: { halign: "right" },
            2: { halign: "center" },
        },
        styles: {
            cellPadding: 4,
        },
        margin: { left: 14, right: 14 },
    });

    // ----- Summary -----
    const finalY = (doc.lastAutoTable?.finalY || 95) + 10;
    const total = order.totalAmount || order.amount || 0;
    const itemsPrice = order.itemsPrice || 0;
    const taxPrice = order.taxPrice || 0;
    const shippingPrice = order.shippingPrice ?? 0;
    const discount = order.discount || 0;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(74, 101, 114);

    const summaryX = 130;
    doc.text("Subtotal:", summaryX, finalY);
    doc.text("Tax:", summaryX, finalY + 6);
    doc.text("Shipping:", summaryX, finalY + 12);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 43, 53);
    doc.text(`Rs. ${itemsPrice.toLocaleString()}`, 196, finalY, { align: "right" });
    doc.text(`Rs. ${taxPrice?.toLocaleString()}`, 196, finalY + 6, { align: "right" });
    doc.text(shippingPrice === 0 ? "Free" : `Rs. ${shippingPrice?.toLocaleString()}`, 196, finalY + 12, { align: "right" });

    // Discount
    let currentY = finalY + 18;
    if (discount > 0) {
        doc.setTextColor(232, 129, 106); // Coral
        doc.text("Discount:", summaryX, currentY);
        doc.text(`- Rs. ${discount?.toLocaleString()}`, 196, currentY, { align: "right" });
        currentY += 6;
    }

    // Grand Total
    doc.setDrawColor(226, 238, 236);
    doc.setLineWidth(0.5);
    doc.line(summaryX, currentY - 2, 196, currentY - 2);

    doc.setFontSize(12);
    doc.setTextColor(26, 43, 53); // Dark
    doc.text("GRAND TOTAL:", summaryX, currentY + 6);
    doc.text(`Rs. ${total?.toLocaleString()}`, 196, currentY + 6, { align: "right" });

    // ----- Footer -----
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(139, 165, 179); // textLite
    doc.text("Thank you for choosing SeaBite. Fresh from the coast to your kitchen.", 105, 280, { align: "center" });

    // Save the PDF
    doc.save(`Invoice_SeaBite_${order.orderId || order._id}.pdf`);
};
