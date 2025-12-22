import React from "react";

export default function Invoice({ order, type = "invoice" }) {
  if (!order) return null;

  const isCancelled = order.status?.includes('Cancelled');
  const isPrepaid = order.paymentMethod === 'Prepaid';
  const isRefunded = isCancelled && isPrepaid && order.refundStatus === "Success";

  return (
    <div id="printable-area">
      <div className="invoice-container">
        {/* 🟢 DYNAMIC CANCELLED WATERMARK */}
        {isCancelled && (
          <div className="watermark">CANCELLED</div>
        )}

        {/* TOP HEADER SECTION */}
        <div className="invoice-header">
          <div className="brand-branding">
            <img src="/logo.png" alt="SeaBite Logo" className="invoice-logo" />
            <div className="brand-text"></div>
          </div>
          <div className="header-meta">
            <div className="doc-type-switcher">
              <span className={type === "label" ? "active" : ""}>SHIPPING LABEL</span>
              <span className="separator"></span>
              <span className={type === "invoice" ? "active" : ""}>TAX INVOICE</span>
            </div>
            <div className="qr-container">
               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${order.orderId}`} alt="QR Code" />
               <p className="qr-text">SCAN FOR TRACKING</p>
            </div>
          </div>
        </div>

        {/* LOGISTICS BAR - TURNS RED IF CANCELLED */}
        <div className={`blue-bar ${isCancelled ? 'bg-red' : ''}`}></div>

        {/* INFO GRID */}
        <div className="info-grid">
          <div className="info-section">
            <label className="section-label">DELIVER TO</label>
            <p className="recipient-name">{order.shippingAddress?.fullName}</p>
            <p className="address-details">
              {order.shippingAddress?.houseNo && `${order.shippingAddress.houseNo}, `}
              {order.shippingAddress?.street}<br />
              {order.shippingAddress?.city}, {order.shippingAddress?.state}<br />
              <span className="pin-code">PIN: {order.shippingAddress?.zip}</span>
            </p>
            <p className="phone-line">📞 +91 {order.shippingAddress?.phone}</p>
          </div>

          <div className="info-section right-align">
            <div className="meta-row">
              <label>ORDER DATE</label>
              <p>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} / {order.paymentMethod || 'COD'}</p>
            </div>
            
            {/* DYNAMIC PAYMENT MODE & REFUND SECTION */}
            <div className="meta-row mt-4">
              <label>PAYMENT MODE</label>
              <p className={order.isPaid ? "blue-text" : "orange-text"}>
                {order.paymentMethod === 'Prepaid' ? 'PREPAID (ONLINE)' : 'CASH ON DELIVERY'}
              </p>
              
              {/* 🟢 REFUND STATUS INDICATOR */}
              {isCancelled && isPrepaid && (
                <div className={`refund-badge ${isRefunded ? 'refund-success' : 'refund-init'}`}>
                    {isRefunded ? "REFUND SUCCESSFUL" : "REFUND INITIATED (6-7 DAYS)"}
                </div>
              )}

              {order.isPaid && order.paymentId && (
                <p className="transaction-id">TXN ID: {order.paymentId}</p>
              )}
              {!order.isPaid && !isCancelled && (
                <p className="cod-instruction text-red-600 font-bold">COLLECT: ₹{order.totalAmount?.toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="table-section">
          <table className="invoice-table">
            <thead>
              <tr>
                <th className="left">PRODUCT DETAILS</th>
                <th className="center">QTY</th>
                <th className="right">UNIT PRICE</th>
                <th className="right">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, i) => (
                 <tr key={i}>
                    <td className="left font-bold">{item.name}</td>
                    <td className="center">{item.qty}</td>
                    <td className="right">₹{item.price?.toFixed(2)}</td>
                    <td className="right">₹{(item.price * item.qty).toFixed(2)}</td>
                 </tr>
              ))}

              <tr className="summary-row">
                <td className="left border-none" colSpan="2"></td>
                <td className="right font-semibold">Subtotal:</td>
                <td className="right">₹{order.itemsPrice?.toFixed(2)}</td>
              </tr>

              {order.discount > 0 && (
                <tr className="discount-row">
                  <td className="left border-none" colSpan="2"></td>
                  <td className="right font-bold green-text">Discount:</td>
                  <td className="right font-bold green-text">- ₹{order.discount?.toFixed(2)}</td>
                </tr>
              )}
              
              <tr>
                <td className="left border-none" colSpan="2"></td>
                <td className="right font-semibold">Shipping:</td>
                <td className="right">{order.shippingPrice === 0 ? "FREE" : `₹${order.shippingPrice}`}</td>
              </tr>
              <tr>
                <td className="left border-none" colSpan="2"></td>
                <td className="right font-semibold">Tax (GST 5%):</td>
                <td className="right">₹{order.taxPrice?.toFixed(2)}</td>
              </tr>

              {/* 🟢 UPDATED GRAND TOTAL LABEL BASED ON CANCELLATION */}
              <tr className={`grand-total-row ${isCancelled ? 'border-red' : ''}`}>
                <td className="left font-black" colSpan="2">{isCancelled ? 'VOID / CANCELLED' : 'GRAND TOTAL'}</td>
                <td className="right font-black">{isCancelled ? 'REFUNDABLE' : 'PAYABLE'}</td>
                <td className={`right font-black ${isCancelled ? 'text-red' : 'blue-text'}`}>
                  ₹{order.totalAmount?.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
          
          {isCancelled && order.cancelReason && (
              <p className="cancel-note">Cancellation Reason: "{order.cancelReason}"</p>
          )}
        </div>

        {/* BOTTOM BRANDING */}
        <div className="footer-branding">
          <p className="thank-you">THANK YOU FOR CHOOSING <span className="blue-text">SEABITE!</span></p>
          <div className="footer-divider"></div>
          <div className="barcode-row">
            <div className="barcode-container">
                <div className="barcode-placeholder">|||| ||| || |||| ||| ||</div>
                <p className="barcode-text">Order ID: {order.orderId}</p>
            </div>
          </div>
        </div>

        {/* INVOICE FOOTER */}
        <div className="legal-footer">
          <label>INVOICE FOOTER</label>
          <p>This is a digitally generated document via SeaBite Logistics. No signature required.</p>
        </div>
      </div>

      <style>{`
        #printable-area { display: none; }

        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area {
            display: block !important;
            position: absolute;
            left: 0; top: 0; width: 100%;
            background: white;
            padding: 0; margin: 0;
          }

          .invoice-container {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: auto;
            position: relative;
            font-family: 'Inter', Arial, sans-serif;
            color: #333;
            overflow: hidden;
          }

          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100pt;
            font-weight: 900;
            color: rgba(255, 0, 0, 0.08);
            z-index: 0;
            pointer-events: none;
            white-space: nowrap;
          }

          .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; position: relative; z-index: 10;}
          .brand-branding { display: flex; align-items: center; gap: 15px; }
          .invoice-logo { height: 60px; width: auto; object-fit: contain; }
          
          .header-meta { display: flex; align-items: center; gap: 20px; }
          .doc-type-switcher { display: flex; align-items: center; border: 1px solid #ddd; border-radius: 20px; padding: 5px 15px; font-size: 10pt; font-weight: 800; color: #999; }
          .doc-type-switcher span.active { color: #333; }
          .separator { width: 1px; height: 15px; background: #ddd; margin: 0 10px; }
          
          .qr-container { text-align: center; }
          .qr-text { font-size: 6pt; font-weight: 900; margin-top: 2px; color: #333; }

          .blue-bar { width: 100%; height: 8px; background: #004aad; margin: 15px 0; }
          .bg-red { background: #dc2626 !important; }

          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; position: relative; z-index: 10;}
          .section-label { font-size: 8pt; font-weight: 900; color: #333; border-bottom: 1px solid #333; display: block; padding-bottom: 3px; margin-bottom: 10px; }
          .recipient-name { font-size: 12pt; font-weight: 900; margin-bottom: 5px; }
          .address-details { font-size: 9pt; line-height: 1.4; color: #555; }
          .pin-code { font-weight: 900; color: #004aad; }
          .phone-line { font-weight: 900; font-size: 9pt; margin-top: 10px; }

          .meta-row label { font-size: 8pt; font-weight: 900; color: #333; display: block; margin-bottom: 2px; }
          .meta-row p { font-size: 9pt; font-weight: 600; margin: 0; }
          .transaction-id { font-size: 7pt !important; color: #004aad; font-family: monospace; margin-top: 2px !important; }
          .right-align { text-align: right; }

          .refund-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 7pt; font-weight: 900; margin-top: 5px; }
          .refund-init { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
          .refund-success { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }

          .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; border-top: 1px solid #ddd; position: relative; z-index: 10; }
          .invoice-table th { background: #f9f9f9; padding: 10px; font-size: 8pt; font-weight: 900; border-bottom: 1px solid #ddd; }
          .invoice-table td { padding: 12px 10px; font-size: 9pt; border-bottom: 1px solid #eee; }
          .border-none { border: none !important; }
          .left { text-align: left; } .center { text-align: center; } .right { text-align: right; }
          
          .green-text { color: #10b981 !important; }
          .blue-text { color: #004aad !important; }
          .orange-text { color: #f59e0b !important; }
          .text-red { color: #dc2626 !important; }
          .font-black { font-weight: 900; }
          
          .grand-total-row { background: #f0f4ff; border-top: 2px solid #004aad; }
          .border-red { background: #fef2f2 !important; border-top: 2px solid #dc2626 !important; }
          .grand-total-row td { font-size: 11pt; padding: 15px 10px; }

          .cancel-note { font-size: 8pt; color: #dc2626; font-style: italic; margin-top: 10px; font-weight: 600; }

          .footer-branding { text-align: center; margin-top: 40px; position: relative; z-index: 10;}
          .thank-you { font-weight: 900; font-size: 11pt; letter-spacing: 1px; }
          .footer-divider { width: 100%; height: 1px; background: #ddd; margin: 15px 0; }
          .barcode-placeholder { font-family: 'monospace'; font-size: 18pt; letter-spacing: 2px; }
          .barcode-text { font-size: 7pt; font-weight: bold; color: #666; }

          .legal-footer { margin-top: 30px; position: relative; z-index: 10; }
          .legal-footer label { font-size: 8pt; font-weight: 900; color: #333; display: block; margin-bottom: 5px; }
          .legal-footer p { font-size: 8pt; color: #999; }

          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}