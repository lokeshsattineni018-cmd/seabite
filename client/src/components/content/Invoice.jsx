import React from "react";

/**
 * Premium Technical Invoice Component
 * Optimized for professional print and "top-level" aesthetics.
 */
export default function Invoice({ order, type = "invoice" }) {
  if (!order) return null;

  const isCancelled = order.status?.includes('Cancelled');
  const isPrepaid = order.paymentMethod === 'Prepaid';
  const isRefunded = isCancelled && isPrepaid && order.refundStatus === "Success";

  return (
    <div id="printable-area">
      <div className="invoice-container">

        {/* ─── WATERMARK ─── */}
        {isCancelled && <div className="watermark">VOID / CANCELLED</div>}

        {/* ─── TOP LEVEL HEADER ─── */}
        <div className="header-grid">
          <div className="brand-section">
            <div className="logo-wrapper">
              <img src="/roundlogo.png" alt="SeaBite" className="main-logo" />
              <div className="brand-info">
                <h1 className="brand-name">SeaBite</h1>
                <p className="brand-tagline">Premium Seafood Logistics</p>
              </div>
            </div>
            <div className="origin-details">
              <p className="legal-name">SeaBite Seafoods Pvt. Ltd.</p>
              <p>West Godavari, Andhra Pradesh</p>
              <p>GSTIN: 37AAHCS5226E1ZA</p>
              <p>Support: support@seabite.co.in</p>
            </div>
          </div>

          <div className="doc-meta">
            <div className="type-badge">
              {type === "invoice" ? "TAX INVOICE" : "SHIPPING LABEL"}
            </div>
            <div className="qr-box">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://seabite.co.in/orders/${order.orderId}`} alt="Track" />
              <span>SCAN TO TRACK</span>
            </div>
          </div>
        </div>

        {/* ─── TECHNICAL BAR ─── */}
        <div className={`status-bar ${isCancelled ? 'status-void' : ''}`}>
          <div className="bar-segment">ORDER ID: <strong>#{order.orderId}</strong></div>
          <div className="bar-segment">DATE: <strong>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</strong></div>
          <div className="bar-segment">PAYMENT: <strong>{order.paymentMethod === 'Prepaid' ? 'PREPAID' : 'COD'}</strong></div>
          <div className="bar-segment">MODE: <strong className={order.isPaid ? 'text-paid' : 'text-unpaid'}>{order.isPaid ? 'PAID' : 'PENDING'}</strong></div>
        </div>

        {/* ─── BILLING GRID ─── */}
        <div className="billing-grid">
          <div className="bill-box">
            <h3 className="box-title">CUSTOMER DETAILS</h3>
            <p className="cust-name">{order.shippingAddress?.fullName}</p>
            <p className="cust-phone">+91 {order.shippingAddress?.phone}</p>
            <div className="cust-addr">
              {order.shippingAddress?.houseNo && <span>{order.shippingAddress.houseNo}, </span>}
              {order.shippingAddress?.street}<br />
              {order.shippingAddress?.city}, {order.shippingAddress?.state} - <strong>{order.shippingAddress?.zip}</strong>
            </div>
          </div>

          <div className="bill-box right-border">
            <h3 className="box-title">LOGISTICS LOG</h3>
            <div className="log-row"><span>Order Ref:</span> <span>SB-{order._id.toString().slice(-6).toUpperCase()}</span></div>
            <div className="log-row"><span>Time:</span> <span>{new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div>
            <div className="log-row"><span>Gateway:</span> <span>{order.paymentMethod === 'Prepaid' ? 'Razorpay' : 'Manual'}</span></div>
            {order.paymentId && <div className="log-row font-mono"><span>TXN:</span> <span className="small-text">{order.paymentId}</span></div>}
          </div>
        </div>

        {/* ─── ITEMIZATION TABLE ─── */}
        <div className="table-wrapper">
          <table className="inv-table">
            <thead>
              <tr>
                <th className="text-left">ITEM DESCRIPTION</th>
                <th className="text-center">QTY</th>
                <th className="text-right">UNIT PRICE</th>
                <th className="text-right">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, i) => (
                <tr key={i}>
                  <td className="text-left">
                    <span className="item-font">{item.name}</span>
                  </td>
                  <td className="text-center">{item.qty}</td>
                  <td className="text-right">₹{item.price?.toLocaleString()}</td>
                  <td className="text-right">₹{(item.price * item.qty).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─── SUMMARY SECTION ─── */}
        <div className="summary-flex">
          <div className="note-section">
            <h4 className="note-title">DECLARATION & TERMS</h4>
            <p className="note-text">
              1. Goods once sold will not be taken back.<br />
              2. Fresh seafood items should be consumed within 24 hours of delivery.<br />
              3. This is a computer-generated invoice, no signature required.
            </p>

            {isCancelled && (
              <div className="cancel-pill">
                REASON: {order.cancelReason || "System/Manual Cancel"}
              </div>
            )}
          </div>

          <div className="totals-section">
            <div className="total-row"><span>Subtotal</span> <span>₹{order.itemsPrice?.toLocaleString()}</span></div>
            {order.discount > 0 && <div className="total-row discount"><span>Discount Applied</span> <span>- ₹{order.discount?.toLocaleString()}</span></div>}
            <div className="total-row"><span>Tax (GST 5%)</span> <span>₹{order.taxPrice?.toLocaleString()}</span></div>
            <div className="total-row"><span>Shipping</span> <span>{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}</span></div>

            <div className="grand-total-box">
              <div className="grand-label">{isCancelled ? 'REFUNDABLE AMOUNT' : 'TOTAL PAYABLE'}</div>
              <div className="grand-value">₹{order.totalAmount?.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* ─── FOOTER ─── */}
        <div className="invoice-footer">
          <div className="official-stamp">
            <div className="stamp-circle">
              Verified Fresh
            </div>
          </div>
          <div className="barcode-box">
            <div className="barcode-visual">|| ||| | ||| || ||| | || |||</div>
            <p className="barcode-meta">{order.orderId}</p>
          </div>
          <div className="company-info-bottom">
            <p className="thank-you">Thank you for choosing SeaBite — Taste the Excellence of the Ocean.</p>
            <p className="web-url">www.seabite.co.in</p>
          </div>
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap');

        #printable-area { display: none; }

        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area {
            display: block !important;
            position: absolute;
            left: 0; top: 0; width: 100%;
            background: #fff;
            padding: 0; margin: 0;
          }

          .invoice-container {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            margin: 0 auto;
            background: #fff;
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: #1A2B35;
            position: relative;
            box-sizing: border-box;
          }

          .watermark {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%) rotate(-35deg);
            font-size: 80pt; font-weight: 800;
            color: rgba(220, 38, 38, 0.04);
            z-index: 0; pointer-events: none;
            white-space: nowrap; border: 15pt solid rgba(220,38,38,0.04);
            padding: 20px;
          }

          /* HEADER GRID */
          .header-grid { display: grid; grid-template-columns: 1fr auto; align-items: flex-start; margin-bottom: 25px; }
          .logo-wrapper { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
          .main-logo { height: 65px; width: 65px; border-radius: 50%; }
          .brand-name { font-size: 24pt; font-weight: 800; color: #1A2B35; margin: 0; letter-spacing: -1px; }
          .brand-tagline { font-size: 8pt; color: #5BA8A0; margin: 0; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
          .origin-details { font-size: 8pt; color: #8BA5B3; line-height: 1.4; }
          .origin-details .legal-name { color: #1A2B35; font-weight: 800; }

          .doc-meta { text-align: right; }
          .type-badge { background: #1A2B35; color: #fff; padding: 6px 15px; font-weight: 800; font-size: 10pt; display: inline-block; border-radius: 4px; border-left: 5px solid #5BA8A0; }
          .qr-box { margin-top: 15px; text-align: center; }
          .qr-box img { width: 70px; height: 70px; }
          .qr-box span { display: block; font-size: 6pt; font-weight: 800; color: #8BA5B3; margin-top: 4px; }

          /* STATUS BAR */
          .status-bar { display: flex; background: #F4F9F8; border: 1px solid #E2EEEC; border-radius: 8px; margin-bottom: 25px; padding: 12px; justify-content: space-around; }
          .bar-segment { font-size: 8pt; color: #8BA5B3; font-weight: 500; }
          .bar-segment strong { color: #1A2B35; margin-left: 5px; font-weight: 700; }
          .text-paid { color: #10B981 !important; }
          .text-unpaid { color: #F59E0B !important; }
          .status-void { background: #FEF2F2; border-color: #FEE2E2; }

          /* BILLING GRID */
          .billing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .bill-box { padding: 15px; border-left: 1px solid #E2EEEC; }
          .box-title { font-size: 7.5pt; font-weight: 800; color: #5BA8A0; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; }
          .cust-name { font-size: 12pt; font-weight: 800; margin-bottom: 4px; }
          .cust-phone { font-size: 9pt; font-weight: 700; color: #1A2B35; margin-bottom: 8px; }
          .cust-addr { font-size: 9pt; color: #8BA5B3; line-height: 1.6; }
          .cust-addr strong { color: #1A2B35; }
          .log-row { display: flex; justify-content: space-between; font-size: 8.5pt; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px dashed #F0F4F7; }
          .log-row span:first-child { color: #8BA5B3; font-weight: 600; }
          .log-row span:last-child { color: #1A2B35; font-weight: 700; }
          .font-mono { font-family: 'JetBrains Mono', monospace; }
          .small-text { font-size: 7pt; }

          /* TABLE */
          .table-wrapper { margin-bottom: 25px; }
          .inv-table { width: 100%; border-collapse: collapse; }
          .inv-table th { font-size: 7.5pt; font-weight: 800; color: #5BA8A0; padding: 10px 15px; border-bottom: 2px solid #1A2B35; background: #fff; }
          .inv-table td { padding: 14px 15px; border-bottom: 1px solid #E2EEEC; font-size: 9.5pt; color: #1A2B35; vertical-align: middle; }
          .item-font { font-weight: 700; display: block; font-size: 10pt; }
          .text-left { text-align: left; } .text-center { text-align: center; } .text-right { text-align: right; }

          /* SUMMARY */
          .summary-flex { display: grid; grid-template-columns: 1.2fr 1fr; gap: 40px; margin-top: 10px; }
          .note-title { font-size: 8pt; font-weight: 800; color: #5BA8A0; margin-bottom: 10px; }
          .note-text { font-size: 7.5pt; color: #8BA5B3; line-height: 1.8; font-weight: 500; }
          .cancel-pill { margin-top: 20px; padding: 10px; background: #FEF2F2; color: #DC2626; border-radius: 4px; font-weight: 800; font-size: 7.5pt; border: 1px solid #FEE2E2; }

          .totals-section { background: #fff; }
          .total-row { display: flex; justify-content: space-between; font-size: 9pt; font-weight: 600; color: #8BA5B3; margin-bottom: 8px; }
          .total-row span:last-child { color: #1A2B35; font-weight: 700; }
          .discount span:last-child { color: #10B981; }
          
          .grand-total-box { margin-top: 20px; padding: 15px; background: #1A2B35; color: #fff; border-radius: 8px; text-align: right; position: relative; overflow: hidden; }
          .grand-total-box::after { content: ''; position: absolute; top: 0; left: 0; width: 5px; height: 100%; background: #5BA8A0; }
          .grand-label { font-size: 7pt; font-weight: 800; letter-spacing: 1px; margin-bottom: 4px; opacity: 0.8; }
          .grand-value { font-size: 18pt; font-weight: 800; }

          /* FOOTER */
          .invoice-footer { margin-top: 60px; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 40px; }
          .stamp-circle { width: 80px; height: 80px; border: 4px double #5BA8A0; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 8pt; font-weight: 900; color: #5BA8A0; text-transform: uppercase; transform: rotate(-12deg); opacity: 0.6; }
          .barcode-box { text-align: center; }
          .barcode-visual { font-family: monospace; font-size: 14pt; letter-spacing: 2px; color: #1A2B35; }
          .barcode-meta { font-size: 6.5pt; font-weight: 800; color: #8BA5B3; margin-top: 2px; }
          .company-info-bottom { text-align: right; }
          .thank-you { font-size: 8.5pt; font-weight: 800; color: #1A2B35; margin-bottom: 4px; }
          .web-url { font-size: 7.5pt; font-weight: 700; color: #5BA8A0; }

          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}