import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Advanced Base64 Image Fetcher
 */
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
            resolve(null);
        };
    });
};

/**
 * Premium PDF Generator
 */
export const generateInvoicePDF = async (order) => {
    const doc = new jsPDF();
    const primaryColor = [91, 168, 160]; // #5BA8A0
    const darkColor = [26, 43, 53];    // #1A2B35
    const midColor = [139, 165, 179];   // #8BA5B3

    // ─── ADD LOGO ───
    try {
        const logoData = await getBase64ImageFromURL("/roundlogo.png");
        if (logoData) {
            doc.addImage(logoData, "PNG", 14, 12, 22, 22);
        }
    } catch (e) {
        // Fallback
    }

    // ─── BRANDING ───
    doc.setFontSize(22);
    doc.setTextColor(...darkColor);
    doc.setFont("helvetica", "bold");
    doc.text("SeaBite", 40, 24);

    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("PREMIUM SEAFOOD LOGISTICS", 40, 29);

    // ─── DOCUMENT TYPE ───
    doc.setDrawColor(...darkColor);
    doc.setFillColor(...darkColor);
    doc.rect(140, 15, 56, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text("TAX INVOICE", 168, 23, { align: "center" });

    // ─── ORIGIN DETAILS (Legal) ───
    doc.setTextColor(...midColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("SeaBite Seafoods Pvt. Ltd.", 14, 42);
    doc.text("West Godavari, Andhra Pradesh", 14, 46);
    doc.text("GSTIN: 37AAHCS5226E1ZA", 14, 50);

    // ─── META INFO ───
    doc.setTextColor(...darkColor);
    doc.setFont("helvetica", "bold");
    doc.text(`Invoice ID:`, 140, 42);
    doc.text(`Order Date:`, 140, 46);
    doc.text(`Payment:`, 140, 50);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...midColor);
    doc.text(`#${order.orderId}`, 196, 42, { align: "right" });
    doc.text(`${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 196, 46, { align: "right" });
    doc.text(`${order.paymentMethod === 'Prepaid' ? 'PREPAID' : 'COD'}`, 196, 50, { align: "right" });

    // ─── SEPARATOR ───
    doc.setDrawColor(226, 238, 236);
    doc.line(14, 56, 196, 56);

    // ─── SHIPPING/BILLING GRID ───
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO (CUSTOMER DETAILS)", 14, 65);
    doc.text("LOGISTICS LOG", 110, 65);

    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.text(order.shippingAddress?.fullName || "Customer", 14, 72);

    doc.setFontSize(9);
    doc.setTextColor(...midColor);
    doc.setFont("helvetica", "normal");
    const addr = order.shippingAddress || {};
    doc.text(`+91 ${addr.phone || ""}`, 14, 77);
    doc.text(`${addr.houseNo ? addr.houseNo + ', ' : ''}${addr.street || ""}`, 14, 82);
    doc.text(`${addr.city || ""}, ${addr.state || ""} - ${addr.zip || ""}`, 14, 86);

    // Logistics side
    doc.text(`Order Ref: SB-${order._id.toString().slice(-6).toUpperCase()}`, 110, 72);
    doc.text(`Gateway: ${order.paymentMethod === 'Prepaid' ? 'Razorpay' : 'Manual'}`, 110, 77);
    if (order.paymentId) doc.text(`TXN ID: ${order.paymentId}`, 110, 82);

    // ─── TABLE ───
    const tableRows = (order.items || []).map((item) => [
        item.name,
        item.qty.toString(),
        `₹${item.price.toLocaleString()}`,
        `₹${(item.price * item.qty).toLocaleString()}`,
    ]);

    autoTable(doc, {
        startY: 95,
        head: [["ITEM DESCRIPTION", "QTY", "UNIT PRICE", "AMOUNT"]],
        body: tableRows,
        theme: "striped",
        headStyles: {
            fillColor: [26, 43, 53],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: "bold",
            halign: "left"
        },
        bodyStyles: {
            fontSize: 9,
            textColor: [26, 43, 53],
            cellPadding: 5
        },
        columnStyles: {
            0: { halign: "left" },
            1: { halign: "center" },
            2: { halign: "right" },
            3: { halign: "right", fontStyle: "bold" },
        },
        margin: { left: 14, right: 14 },
    });

    // ─── SUMMARY ───
    const finalY = doc.lastAutoTable.finalY + 12;
    const itemsPrice = order.itemsPrice || 0;
    const taxPrice = order.taxPrice || 0;
    const shippingPrice = order.shippingPrice ?? 0;
    const discount = order.discount || 0;
    const total = order.totalAmount || 0;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...midColor);

    const summaryX = 135;
    doc.text("Subtotal:", summaryX, finalY);
    doc.text("GST (5%):", summaryX, finalY + 6);
    doc.text("Shipping:", summaryX, finalY + 12);
    if (discount > 0) doc.text("Discount:", summaryX, finalY + 18);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkColor);
    doc.text(`₹${itemsPrice.toLocaleString()}`, 196, finalY, { align: "right" });
    doc.text(`₹${taxPrice.toLocaleString()}`, 196, finalY + 6, { align: "right" });
    doc.text(shippingPrice === 0 ? "FREE" : `₹${shippingPrice.toLocaleString()}`, 196, finalY + 12, { align: "right" });
    if (discount > 0) {
        doc.setTextColor(16, 185, 129); // Green
        doc.text(`- ₹${discount.toLocaleString()}`, 196, finalY + 18, { align: "right" });
    }

    // ─── TOTAL BOX ───
    const totalBoxY = finalY + (discount > 0 ? 24 : 18);
    doc.setFillColor(...darkColor);
    doc.rect(summaryX - 5, totalBoxY, 66, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text("TOTAL PAYABLE", summaryX, totalBoxY + 8);
    doc.text(`₹${total.toLocaleString()}`, 196, totalBoxY + 8, { align: "right" });

    // ─── FOOTER ───
    doc.setTextColor(...midColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Declaration: Fresh seafood should be consumed within 24 hours.", 14, 280);
    doc.text("This is a computer-generated invoice, no signature required.", 14, 284);

    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("www.seabite.co.in", 196, 284, { align: "right" });

    // Save
    doc.save(`SeaBite_Invoice_${order.orderId}.pdf`);
};
