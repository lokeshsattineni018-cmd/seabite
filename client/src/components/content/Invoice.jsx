import React from "react";

/**
 * SeaBite Invoice Component
 * Minimal · Aesthetic · Print-ready
 *
 * Usage: rendered inside generateInvoicePDF() or any print trigger.
 * Hidden on screen, visible only on @media print.
 */
export default function Invoice({ order, type = "invoice" }) {
  if (!order) return null;

  const isCancelled = order.status?.includes("Cancelled");
  const isPrepaid = order.paymentMethod === "Prepaid";
  const isRefunded = isCancelled && isPrepaid && order.refundStatus === "Success";

  const date = new Date(order.createdAt);
  const dateStr = date.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const fmt = (n) => `₹${(n || 0).toLocaleString("en-IN")}`;

  return (
    <div id="printable-area">
      <div className="inv-wrap">

        {/* ── VOID WATERMARK ── */}
        {isCancelled && <div className="inv-void-mark">VOID</div>}

        {/* ══════════════════════════════
            HEADER
        ══════════════════════════════ */}
        <div className="inv-header">
          {/* Brand left */}
          <div className="inv-brand">
            <div className="inv-logo-row">
              <img src="/roundlogo.png" alt="SeaBite" className="inv-logo" />
              <div>
                <p className="inv-brand-name">SeaBite</p>
                <p className="inv-brand-sub">Fresh Seafood Delivered</p>
              </div>
            </div>
            <div className="inv-brand-addr">
              <p className="inv-addr-company">SeaBite Seafoods Pvt. Ltd.</p>
              <p>West Godavari, Andhra Pradesh — 534002</p>
              <p>GSTIN: 37AAHCS5226E1ZA</p>
              <p>support@seabite.co.in</p>
            </div>
          </div>

          {/* Doc meta right */}
          <div className="inv-meta">
            <p className="inv-doc-type">
              {isCancelled ? "VOID INVOICE" : type === "invoice" ? "TAX INVOICE" : "SHIPPING LABEL"}
            </p>
            <p className="inv-doc-id">#{order.orderId}</p>
            <p className="inv-doc-date">{dateStr}</p>
            <p className="inv-doc-time">{timeStr} IST</p>
            <div className="inv-qr">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://seabite.co.in/orders/${order.orderId}`}
                alt="Track order"
              />
              <p className="inv-qr-label">Scan to track</p>
            </div>
          </div>
        </div>

        {/* ── THIN DIVIDER ── */}
        <div className="inv-rule" />

        {/* ══════════════════════════════
            AMOUNT HERO BAND
        ══════════════════════════════ */}
        <div className={`inv-hero ${isCancelled ? "inv-hero-void" : ""}`}>
          <div>
            <p className="inv-hero-label">
              {isCancelled ? "Refundable Amount" : "Total Payable"}
            </p>
            <p className="inv-hero-amount">{fmt(order.totalAmount)}</p>
            <p className="inv-hero-sub">
              {order.shippingPrice === 0 ? "Free delivery" : `Shipping: ${fmt(order.shippingPrice)}`}
              {order.discount > 0 ? `  ·  Saved ${fmt(order.discount)}` : ""}
            </p>
          </div>
          <div className="inv-hero-right">
            <p className={`inv-status-pill ${isCancelled ? "pill-void" :
              order.isPaid ? "pill-paid" : "pill-cod"
              }`}>
              {isCancelled ? "Cancelled" : order.isPaid ? "Paid" : "Cash on Delivery"}
            </p>
            <p className="inv-hero-method">
              {isPrepaid ? "Razorpay · Prepaid" : "Cash on Delivery"}
            </p>
            {order.paymentId && (
              <p className="inv-txn-id">{order.paymentId}</p>
            )}
            {isRefunded && (
              <p className="inv-refund-note">✓ Refund Processed</p>
            )}
          </div>
        </div>

        {/* ══════════════════════════════
            BILLING INFO
        ══════════════════════════════ */}
        <div className="inv-billing">
          {/* Customer */}
          <div className="inv-bill-col">
            <p className="inv-col-title">Ship To</p>
            <p className="inv-cust-name">{order.shippingAddress?.fullName}</p>
            <p className="inv-cust-phone">+91 {order.shippingAddress?.phone}</p>
            <p className="inv-cust-addr">
              {order.shippingAddress?.houseNo && `${order.shippingAddress.houseNo}, `}
              {order.shippingAddress?.street}<br />
              {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.zip}
            </p>
            {order.shippingAddress?.instructions && (
              <p className="inv-delivery-note">📝 {order.shippingAddress.instructions}</p>
            )}
          </div>

          {/* Divider */}
          <div className="inv-col-divider" />

          {/* Transaction log */}
          <div className="inv-bill-col">
            <p className="inv-col-title">Transaction</p>
            <div className="inv-log-row">
              <span>Reference</span>
              <span>SB-{order._id?.toString().slice(-6).toUpperCase()}</span>
            </div>
            <div className="inv-log-row">
              <span>Date</span>
              <span>{dateStr}</span>
            </div>
            <div className="inv-log-row">
              <span>Time</span>
              <span>{timeStr}</span>
            </div>
            <div className="inv-log-row">
              <span>Gateway</span>
              <span>{isPrepaid ? "Razorpay" : "Manual / COD"}</span>
            </div>
            <div className="inv-log-row">
              <span>Status</span>
              <span className={order.isPaid ? "text-green" : isCancelled ? "text-red" : "text-amber"}>
                {isCancelled ? "Cancelled" : order.isPaid ? "Paid" : "Pending"}
              </span>
            </div>
            {order.paymentId && (
              <div className="inv-log-row inv-log-mono">
                <span>TXN ID</span>
                <span>{order.paymentId}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── THIN RULE ── */}
        <div className="inv-rule" />

        {/* ══════════════════════════════
            ITEMS TABLE
        ══════════════════════════════ */}
        <div className="inv-table-section">
          <table className="inv-table">
            <thead>
              <tr>
                <th className="th-left">Item</th>
                <th className="th-center">Qty</th>
                <th className="th-right">Unit Price</th>
                <th className="th-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? "tr-even" : ""}>
                  <td className="td-item">
                    <span className="td-item-name">{item.name}</span>
                  </td>
                  <td className="td-center">{item.qty}</td>
                  <td className="td-right">{fmt(item.price)}</td>
                  <td className="td-right td-total">{fmt((item.price || 0) * (item.qty || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ══════════════════════════════
            SUMMARY + TERMS
        ══════════════════════════════ */}
        <div className="inv-summary">
          {/* Terms left */}
          <div className="inv-terms">
            <p className="inv-col-title">Terms & Declaration</p>
            <ol className="inv-terms-list">
              <li>Goods once sold will not be taken back.</li>
              <li>Fresh seafood must be consumed within 24 hours of delivery.</li>
              <li>System-generated invoice — no physical signature required.</li>
              <li>For disputes, contact us within 24 hours of delivery.</li>
              <li>Subject to West Godavari jurisdiction only.</li>
            </ol>
            {isCancelled && (
              <div className="inv-cancel-reason">
                ⊘ Cancellation Reason: {order.cancelReason || "System / Manual Cancel"}
              </div>
            )}
          </div>

          {/* Totals right */}
          <div className="inv-totals">
            <div className="inv-total-row">
              <span>Subtotal</span>
              <span>{fmt(order.itemsPrice)}</span>
            </div>
            {order.discount > 0 && (
              <div className="inv-total-row inv-discount">
                <span>Discount</span>
                <span>− {fmt(order.discount)}</span>
              </div>
            )}
            <div className="inv-total-row">
              <span>GST (5%)</span>
              <span>{fmt(order.taxPrice)}</span>
            </div>
            <div className="inv-total-row">
              <span>Shipping</span>
              <span className={order.shippingPrice === 0 ? "text-green" : ""}>
                {order.shippingPrice === 0 ? "FREE" : fmt(order.shippingPrice)}
              </span>
            </div>
            <div className="inv-grand">
              <span>{isCancelled ? "Refundable" : "Total"}</span>
              <span>{fmt(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════
            FOOTER
        ══════════════════════════════ */}
        <div className="inv-rule inv-rule-thick" />
        <div className="inv-footer">
          <div className="inv-stamp">
            <p>Verified</p>
            <p>Fresh</p>
            <p>✓</p>
          </div>

          <div className="inv-barcode">
            <p className="inv-barcode-lines">||| | ||| || | ||| | || |||</p>
            <p className="inv-barcode-id">{order.orderId}</p>
          </div>

          <div className="inv-footer-right">
            <p className="inv-footer-quote">"Taste the Excellence of the Ocean."</p>
            <p className="inv-footer-url">www.seabite.co.in</p>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════
          PRINT STYLES
      ══════════════════════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300&family=Geist+Mono:wght@400;500&family=Figtree:wght@300;400;500;600;700&display=swap');

        /* Hidden on screen */
        #printable-area { display: none; }

        @media print {
          /* Reset */
          body * { visibility: hidden; }
          #printable-area,
          #printable-area * { visibility: visible; }
          #printable-area {
            display: block !important;
            position: absolute;
            left: 0; top: 0; width: 100%;
            background: #fff;
            padding: 0; margin: 0;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

          /* ── Root vars ── */
          .inv-wrap {
            width: 210mm;
            min-height: 297mm;
            padding: 14mm 16mm;
            margin: 0 auto;
            background: #fff;
            font-family: 'Figtree', sans-serif;
            color: #0c1a2e;
            position: relative;
            box-sizing: border-box;
          }

          /* ── VOID watermark ── */
          .inv-void-mark {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%) rotate(-32deg);
            font-size: 88pt;
            font-weight: 900;
            font-family: 'Fraunces', serif;
            color: rgba(239,68,68,0.04);
            border: 12pt solid rgba(239,68,68,0.04);
            padding: 8pt 28pt;
            white-space: nowrap;
            z-index: 0;
            pointer-events: none;
            letter-spacing: 12pt;
          }

          /* ── HEADER ── */
          .inv-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 18pt;
          }

          .inv-logo-row {
            display: flex; align-items: center; gap: 10pt;
            margin-bottom: 12pt;
          }
          .inv-logo {
            width: 48pt; height: 48pt;
            border-radius: 12pt;
            object-fit: cover;
          }
          .inv-brand-name {
            font-family: 'Fraunces', serif;
            font-size: 22pt; font-weight: 600;
            color: #0c1a2e; margin: 0; line-height: 1;
            letter-spacing: -0.5pt;
          }
          .inv-brand-sub {
            font-size: 7pt; font-weight: 600;
            color: #6b8cad; text-transform: uppercase;
            letter-spacing: 1.5pt; margin: 3pt 0 0;
          }
          .inv-brand-addr {
            font-size: 8pt; color: #6b8cad; line-height: 1.7;
          }
          .inv-addr-company {
            font-weight: 700; color: #2d4a6b;
            margin-bottom: 3pt;
          }

          /* Right meta */
          .inv-meta { text-align: right; }
          .inv-doc-type {
            font-size: 7.5pt; font-weight: 700;
            letter-spacing: 2pt; text-transform: uppercase;
            color: #0ea5e9;
            background: rgba(14,165,233,0.08);
            padding: 3pt 9pt; border-radius: 3pt;
            display: inline-block; margin-bottom: 8pt;
          }
          .inv-doc-id {
            font-family: 'Geist Mono', monospace;
            font-size: 13pt; font-weight: 500;
            color: #0c1a2e; margin-bottom: 4pt;
          }
          .inv-doc-date {
            font-size: 9pt; color: #2d4a6b; font-weight: 500;
            margin-bottom: 2pt;
          }
          .inv-doc-time {
            font-size: 8pt; color: #6b8cad;
            margin-bottom: 10pt;
          }
          .inv-qr { text-align: center; }
          .inv-qr img { width: 60pt; height: 60pt; }
          .inv-qr-label {
            font-size: 6pt; font-weight: 600;
            color: #a8c0d6; letter-spacing: 1pt;
            text-transform: uppercase; margin-top: 3pt;
          }

          /* ── RULES ── */
          .inv-rule {
            border: none; border-top: 1pt solid #e2eaf2;
            margin: 14pt 0;
          }
          .inv-rule-thick { border-top-width: 1.5pt; border-color: #0c1a2e; }

          /* ── HERO BAND ── */
          .inv-hero {
            background: #0c1a2e;
            border-radius: 10pt;
            padding: 16pt 20pt;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 18pt;
            position: relative;
            overflow: hidden;
          }
          .inv-hero-void { background: #7f1d1d; }
          .inv-hero-label {
            font-size: 7pt; font-weight: 600;
            letter-spacing: 1.8pt; text-transform: uppercase;
            color: rgba(255,255,255,0.4); margin-bottom: 4pt;
          }
          .inv-hero-amount {
            font-family: 'Fraunces', serif;
            font-size: 38pt; font-weight: 300;
            color: #fff; letter-spacing: -1.5pt; line-height: 1;
          }
          .inv-hero-sub {
            font-size: 8pt; color: rgba(255,255,255,0.35);
            margin-top: 5pt;
          }
          .inv-hero-right { text-align: right; }
          .inv-status-pill {
            display: inline-block;
            font-size: 8pt; font-weight: 700;
            padding: 3pt 10pt; border-radius: 99pt;
            margin-bottom: 7pt;
          }
          .pill-paid    { background: rgba(16,185,129,0.18); color: #34d399; }
          .pill-cod     { background: rgba(245,158,11,0.18); color: #fbbf24; }
          .pill-void    { background: rgba(239,68,68,0.18);  color: #f87171; }
          .inv-hero-method {
            font-size: 8pt; color: rgba(255,255,255,0.35);
            margin-bottom: 4pt;
          }
          .inv-txn-id {
            font-family: 'Geist Mono', monospace;
            font-size: 7pt; color: rgba(255,255,255,0.2);
          }
          .inv-refund-note {
            font-size: 8pt; font-weight: 700; color: #34d399;
            margin-top: 5pt;
          }

          /* ── BILLING ── */
          .inv-billing {
            display: grid;
            grid-template-columns: 1fr 1pt 1fr;
            gap: 0;
            margin-bottom: 18pt;
          }
          .inv-col-divider {
            background: #e2eaf2; width: 1pt;
            margin: 0 20pt;
          }
          .inv-col-title {
            font-size: 7.5pt; font-weight: 700;
            letter-spacing: 1.8pt; text-transform: uppercase;
            color: #a8c0d6; margin-bottom: 10pt;
          }
          .inv-cust-name {
            font-family: 'Fraunces', serif;
            font-size: 13pt; font-weight: 400;
            color: #0c1a2e; margin-bottom: 3pt;
          }
          .inv-cust-phone {
            font-family: 'Geist Mono', monospace;
            font-size: 9pt; color: #2d4a6b;
            margin-bottom: 7pt;
          }
          .inv-cust-addr {
            font-size: 9pt; color: #6b8cad; line-height: 1.7;
          }
          .inv-delivery-note {
            margin-top: 8pt; padding: 6pt 8pt;
            background: #f0f9ff;
            border-left: 3pt solid #0ea5e9;
            font-size: 8pt; color: #0369a1;
            font-style: italic;
          }

          .inv-log-row {
            display: flex; justify-content: space-between;
            font-size: 8.5pt; padding: 5pt 0;
            border-bottom: 1pt dashed #e2eaf2;
          }
          .inv-log-row:last-child { border-bottom: none; }
          .inv-log-row span:first-child { color: #6b8cad; }
          .inv-log-row span:last-child {
            font-weight: 600; color: #0c1a2e;
          }
          .inv-log-mono span:last-child {
            font-family: 'Geist Mono', monospace;
            font-size: 7.5pt;
          }
          .text-green { color: #10b981 !important; }
          .text-amber { color: #f59e0b !important; }
          .text-red   { color: #ef4444 !important; }

          /* ── TABLE ── */
          .inv-table-section { margin-bottom: 18pt; }
          .inv-table {
            width: 100%; border-collapse: collapse;
          }
          .inv-table thead tr {
            border-bottom: 2pt solid #0c1a2e;
          }
          .th-left   { font-size: 7pt; font-weight: 700; letter-spacing: 1.5pt; text-transform: uppercase; color: #6b8cad; padding: 0 0 8pt; text-align: left; }
          .th-center { font-size: 7pt; font-weight: 700; letter-spacing: 1.5pt; text-transform: uppercase; color: #6b8cad; padding: 0 0 8pt; text-align: center; }
          .th-right  { font-size: 7pt; font-weight: 700; letter-spacing: 1.5pt; text-transform: uppercase; color: #6b8cad; padding: 0 0 8pt; text-align: right; }

          .inv-table tbody tr { border-bottom: 1pt solid #e2eaf2; }
          .inv-table tbody tr:last-child { border-bottom: none; }
          .tr-even { background: #f7f9fc; }

          .td-item  { padding: 10pt 0; text-align: left; }
          .td-center{ padding: 10pt 0; text-align: center; font-size: 10pt; color: #2d4a6b; }
          .td-right { padding: 10pt 0; text-align: right; font-family: 'Geist Mono', monospace; font-size: 9pt; color: #2d4a6b; }
          .td-total { font-weight: 600; color: #0c1a2e !important; }
          .td-item-name {
            font-family: 'Fraunces', serif;
            font-size: 11pt; font-weight: 400;
            color: #0c1a2e; display: block;
          }

          /* ── SUMMARY ── */
          .inv-summary {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 32pt;
          }
          .inv-terms-list {
            padding-left: 12pt;
            font-size: 8pt; color: #6b8cad;
            line-height: 2;
          }
          .inv-cancel-reason {
            margin-top: 10pt; padding: 7pt 10pt;
            background: #fef2f2;
            border-left: 3pt solid #ef4444;
            font-size: 8pt; font-weight: 700;
            color: #dc2626; border-radius: 0 4pt 4pt 0;
          }
          .inv-total-row {
            display: flex; justify-content: space-between;
            font-size: 9pt; padding: 6pt 0;
            border-bottom: 1pt solid #e2eaf2; color: #6b8cad;
          }
          .inv-total-row span:last-child {
            font-family: 'Geist Mono', monospace;
            font-weight: 600; color: #0c1a2e;
          }
          .inv-discount span:last-child { color: #10b981 !important; }
          .inv-grand {
            display: flex; justify-content: space-between;
            align-items: center;
            padding: 10pt 0 0; margin-top: 4pt;
            border-top: 1.5pt solid #0c1a2e;
          }
          .inv-grand span:first-child {
            font-size: 11pt; font-weight: 700; color: #0c1a2e;
          }
          .inv-grand span:last-child {
            font-family: 'Fraunces', serif;
            font-size: 16pt; font-weight: 400;
            color: #0c1a2e; letter-spacing: -0.5pt;
          }

          /* ── FOOTER ── */
          .inv-footer {
            margin-top: 20pt;
            display: grid;
            grid-template-columns: auto 1fr auto;
            align-items: center;
            gap: 24pt;
          }
          .inv-stamp {
            width: 64pt; height: 64pt;
            border: 2.5pt dashed #0ea5e9;
            border-radius: 50%;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            font-size: 7.5pt; font-weight: 700;
            color: #0ea5e9; text-transform: uppercase;
            transform: rotate(-10deg); opacity: 0.5;
            line-height: 1.5; letter-spacing: 0.5pt;
          }
          .inv-barcode { text-align: center; }
          .inv-barcode-lines {
            font-family: 'Geist Mono', monospace;
            font-size: 16pt; letter-spacing: 3pt;
            color: #0c1a2e; line-height: 1;
          }
          .inv-barcode-id {
            font-family: 'Geist Mono', monospace;
            font-size: 7pt; color: #a8c0d6;
            margin-top: 3pt; letter-spacing: 1pt;
          }
          .inv-footer-right { text-align: right; }
          .inv-footer-quote {
            font-family: 'Fraunces', serif;
            font-size: 9pt; font-style: italic;
            color: #2d4a6b; margin-bottom: 4pt;
          }
          .inv-footer-url {
            font-size: 8.5pt; font-weight: 700;
            color: #0ea5e9;
          }
        }
      `}</style>
    </div>
  );
}