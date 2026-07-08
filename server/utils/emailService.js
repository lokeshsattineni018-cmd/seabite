import { Resend } from 'resend';

// 🚨 SAFE INITIALIZATION: Prevents crash if RESEND_API_KEY is missing
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

if (!resend) {
  console.warn("❌ [EMAIL SERVICE] CRITICAL: RESEND_API_KEY is missing or undefined. Emails will not be sent.");
} else {
  console.log("✅ [EMAIL SERVICE] Initialized with API Key:", process.env.RESEND_API_KEY.substring(0, 5) + "...");
}

const OFFICIAL_SENDER = 'SeaBite Fresh Catch <notifications@seabite.co.in>';
const ORDERS_SENDER = 'SeaBite Orders <orders@seabite.co.in>';

const LOGO_URL = process.env.LOGO_URL || "https://www.seabite.co.in/logo.png";
const API_URL = process.env.VITE_API_URL || "https://seabite.co.in";

const getEmailImageUrl = (path) => {
  if (!path || typeof path !== 'string') return "https://placehold.co/400?text=No+Image";
  if (path.startsWith("http")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return cleanPath.startsWith("/uploads")
    ? `${API_URL}${cleanPath}`
    : `${API_URL}/uploads${cleanPath}`;
};

const logEmailError = (type, error, context) => {
  console.error(`❌ [EMAIL FAILED] Type: ${type} | Error: ${error.message || error} | Context:`, JSON.stringify(context));
};

const logEmailSuccess = (type, email) => {
  console.log(`📧 [EMAIL SENT] Type: ${type} | Recipient: ${email}`);
};

/**
 * Ultra-Modern Stripe/Apple-Style Email Wrapper
 * Spacious, minimalist card layout with modern typography, subtle micro-borders,
 * clean floating branding, and tactile button controls.
 */
const emailWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SeaBite</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #F8F9FA;
      color: #212529;
      -webkit-font-smoothing: antialiased;
    }
    
    @keyframes cardSlideIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .main-card {
      animation: cardSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .btn-hover:hover {
      background-color: #000000 !important;
      transform: translateY(-1px);
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8F9FA; padding: 48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" class="main-card" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E9ECEF; box-shadow: 0 8px 30px rgba(0,0,0,0.02);">
          <!-- Minimalist Floating Header -->
          <tr>
            <td style="padding: 40px 48px 24px; text-align: left;">
              <img src="${LOGO_URL}" alt="SeaBite" height="30" style="display: block; max-height: 30px; border: 0;">
            </td>
          </tr>
          <!-- Body Content Area -->
          <tr>
            <td style="padding: 0 48px 48px; line-height: 1.6; font-size: 15px; color: #495057;">
              ${content}
            </td>
          </tr>
          <!-- Minimalist Footer -->
          <tr>
            <td style="padding: 32px 48px; background-color: #FAFBFB; border-top: 1px solid #E9ECEF; font-size: 12px; color: #868E96; line-height: 1.5; text-align: left;">
              <p style="margin: 0 0 4px; font-weight: 600; color: #212529;">SeaBite Co.</p>
              <p style="margin: 0 0 16px;">Mogalthur, 534281, West Godavari, Andhra Pradesh, India</p>
              <p style="margin: 0 0 24px;">Daily catch sourced directly at 4 AM and delivered by noon.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                <tr>
                  <td><a href="${API_URL}/privacy" style="color: #495057; text-decoration: underline; font-weight: 500;">Privacy</a></td>
                  <td style="padding: 0 8px; color: #CED4DA;">&middot;</td>
                  <td><a href="${API_URL}/terms" style="color: #495057; text-decoration: underline; font-weight: 500;">Terms</a></td>
                  <td style="padding: 0 8px; color: #CED4DA;">&middot;</td>
                  <td><a href="mailto:support@seabite.co.in" style="color: #495057; text-decoration: underline; font-weight: 500;">Contact</a></td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Tactile Modern Apple/Stripe-Style Buttons
const btnStyle = `display: inline-block; padding: 12px 24px; background-color: #111111; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; transition: background-color 0.15s, transform 0.15s; border: none; text-align: center;`;
const btnStyleOutline = `display: inline-block; padding: 11px 23px; background-color: #ffffff; color: #212529; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #CED4DA; transition: background-color 0.15s, transform 0.15s; text-align: center;`;

/**
 * 1. AUTH: Login / Welcome
 */
export const sendAuthEmail = async (email, name, isNewUser = false) => {
  console.log(`🔍 [DEBUG] sendAuthEmail triggered for: ${email} (NewUser: ${isNewUser})`);
  if (!resend) return console.log("⚠️ Email skipped: Missing RESEND_API_KEY");

  const istTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", timeStyle: "short", dateStyle: "medium" });

  const content = isNewUser ? `
    <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 700; color: #111111; letter-spacing: -0.03em;">Welcome to SeaBite</h1>
    <p style="margin: 0 0 24px; font-size: 15px; color: #495057; line-height: 1.6;">
      Hi ${name}, your account is officially set up. We source clean, premium catches directly from Mogalthur Coast at 4 AM and complete last-mile delivery to your kitchen before noon.
    </p>
    
    <div style="background-color: #F8F9FA; border-radius: 12px; padding: 20px; margin-bottom: 32px; border-left: 3px solid #111111;">
      <h3 style="margin: 0 0 6px; font-size: 14px; font-weight: 600; color: #212529;">Freshness Guarantee</h3>
      <p style="margin: 0; font-size: 13px; color: #868E96; line-height: 1.5;">Our operations preserve cold-chain integrity from catch to door, meaning your seafood is never frozen or chemically preserved.</p>
    </div>

    <div style="text-align: left;">
      <a href="${API_URL}" class="btn-hover" style="${btnStyle}">Explore Daily Catch</a>
    </div>
  ` : `
    <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 700; color: #111111; letter-spacing: -0.03em;">New sign-in detected</h1>
    <p style="margin: 0 0 24px; font-size: 15px; color: #495057; line-height: 1.6;">
      Hi ${name}, a new sign-in was completed for your SeaBite account.
    </p>

    <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8F9FA; border-radius: 12px; padding: 16px 20px; margin-bottom: 32px; border: 1px solid #E9ECEF;">
      <tr>
        <td style="font-size: 13px; color: #868E96; padding-bottom: 6px;">Time</td>
        <td style="font-size: 13px; color: #212529; font-weight: 600; text-align: right; padding-bottom: 6px;">${istTime} IST</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #868E96;">Verification</td>
        <td style="font-size: 13px; color: #212529; font-weight: 600; text-align: right;">One-Time Passcode</td>
      </tr>
    </table>

    <p style="margin: 0 0 32px; font-size: 14px; color: #868E96; line-height: 1.6;">
      If you did not make this request, please contact our support desk immediately to secure your profile.
    </p>

    <div style="text-align: left;">
      <a href="${API_URL}" class="btn-hover" style="${btnStyle}">Go to Dashboard</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: isNewUser ? `Welcome to SeaBite, ${name}!` : 'Sign-in verification — SeaBite',
      html: emailWrapper(content)
    });
    logEmailSuccess(isNewUser ? "WELCOME" : "LOGIN", email);
    return result;
  } catch (err) {
    logEmailError("AUTH_EMAIL", err, { email, name });
  }
};

/**
 * 2. ORDERS: Order Confirmation Receipt
 */
export const sendOrderPlacedEmail = async (email, name, orderId, total, items, paymentMethod) => {
  console.log(`🔍 [DEBUG] sendOrderPlacedEmail triggered for: ${email} (Order: ${orderId})`);
  if (!resend) return;

  const isCOD = paymentMethod === "COD";
  
  let subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  let discount = 0;
  let shippingPrice = subtotal < 1000 ? 99 : 0;
  let taxPrice = Math.round((subtotal - discount) * 0.05);

  try {
    const Order = (await import("../models/Order.js")).default;
    const orderData = await Order.findOne({ $or: [{ orderId: orderId.toString() }, { orderId: Number(orderId) || 0 }] }).lean();
    if (orderData) {
      subtotal = orderData.itemsPrice || subtotal;
      discount = orderData.discount || 0;
      shippingPrice = typeof orderData.shippingPrice === 'number' ? orderData.shippingPrice : shippingPrice;
      taxPrice = typeof orderData.taxPrice === 'number' ? orderData.taxPrice : taxPrice;
    }
  } catch (err) {
    console.log("Could not load order details from DB for email:", err.message);
  }

  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #E9ECEF; vertical-align: top; width: 56px;">
        <img src="${getEmailImageUrl(item.image)}" width="48" height="48" style="border-radius: 8px; object-fit: cover; display: block; border: 1px solid #E9ECEF;">
      </td>
      <td style="padding: 16px 12px; border-bottom: 1px solid #E9ECEF; vertical-align: top;">
        <div style="font-size: 14px; font-weight: 600; color: #212529; margin-bottom: 2px;">${item.name}</div>
        <div style="font-size: 12px; color: #868E96;">Qty: ${item.qty} &times; ₹${item.price.toLocaleString()}</div>
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid #E9ECEF; text-align: right; font-size: 14px; font-weight: 600; color: #212529; vertical-align: top;">₹${(item.price * item.qty).toLocaleString()}</td>
    </tr>
  `).join('');

  const content = `
    <!-- Minimalist SVG Checkmark -->
    <div style="text-align: left; margin-bottom: 32px;">
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
        <tr>
          <td style="width: 44px; height: 44px; background-color: #E8F5E9; border-radius: 50%; text-align: center; vertical-align: middle;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </td>
        </tr>
      </table>
      <h1 style="margin: 0 0 4px; font-size: 26px; font-weight: 700; color: #111111; letter-spacing: -0.03em;">Your order is confirmed</h1>
      <p style="margin: 0; font-size: 14px; color: #868E96; font-weight: 500;">Order ID: #${orderId} &middot; ${isCOD ? 'Cash on Delivery' : 'Paid Online'}</p>
    </div>

    <p style="font-size: 15px; color: #495057; line-height: 1.6; margin: 0 0 24px;">
      Hi ${name}, thank you for shopping with us. Your dispatch schedule is being calculated at the local facility, and we will update you once your catches leave the coast.
    </p>

    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px;">
      ${itemRows}
    </table>

    <!-- Pricing Summary Card -->
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 32px; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #868E96;">Subtotal</td>
        <td style="padding: 8px 0; text-align: right; color: #212529; font-weight: 500;">₹${subtotal.toLocaleString()}</td>
      </tr>
      ${discount > 0 ? `
      <tr>
        <td style="padding: 8px 0; color: #2E7D32; font-weight: 600;">Discounts</td>
        <td style="padding: 8px 0; text-align: right; color: #2E7D32; font-weight: 600;">-₹${discount.toLocaleString()}</td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 8px 0; color: #868E96;">Delivery Charge</td>
        <td style="padding: 8px 0; text-align: right; color: #212529; font-weight: 500;">${shippingPrice > 0 ? `₹${shippingPrice.toLocaleString()}` : 'Free'}</td>
      </tr>
      ${taxPrice > 0 ? `
      <tr>
        <td style="padding: 8px 0; color: #868E96;">GST (5%)</td>
        <td style="padding: 8px 0; text-align: right; color: #212529; font-weight: 500;">₹${taxPrice.toLocaleString()}</td>
      </tr>
      ` : ''}
      <tr>
        <td colspan="2" style="padding: 8px 0 4px; border-bottom: 1px solid #E9ECEF;"></td>
      </tr>
      <tr>
        <td style="padding: 12px 0 0; font-size: 15px; font-weight: 700; color: #111111;">${isCOD ? 'Amount to Pay' : 'Total Paid'}</td>
        <td style="padding: 12px 0 0; text-align: right; font-size: 18px; font-weight: 700; color: #111111;">₹${total.toLocaleString()}</td>
      </tr>
    </table>

    <div style="background-color: #F8F9FA; border-radius: 12px; padding: 16px 20px; margin-bottom: 32px; border: 1px solid #E9ECEF; text-align: left;">
      <div style="font-size: 11px; font-weight: 600; color: #868E96; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Logistics Schedule</div>
      <div style="font-size: 14px; font-weight: 600; color: #212529;">Express Delivery (Zero Lag Cold Chain)</div>
    </div>

    <div style="text-align: left;">
      <a href="${API_URL}/orders/${orderId}" class="btn-hover" style="${btnStyle}">Track Shipment</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: ORDERS_SENDER,
      to: email,
      subject: `Order confirmed — #${orderId} | SeaBite`,
      html: emailWrapper(content)
    });
    logEmailSuccess("ORDER_CONFIRMED", email);
    return result;
  } catch (err) {
    logEmailError("ORDER_EMAIL", err, { email, orderId });
  }
};

/**
 * 3. STATUS: Order Status Update
 */
export const sendStatusUpdateEmail = async (email, name, orderId, status, items = [], driverInfo = null) => {
  console.log(`🔍 [DEBUG] sendStatusUpdateEmail triggered for: ${email} (Order: ${orderId}, Status: ${status})`);
  if (!resend) return;

  const isDelivered = status === 'Delivered';
  const statusColor = isDelivered ? '#1E7E34' : '#0F4C81';
  const statusBg = isDelivered ? '#EAF2EC' : '#E6F0FA';

  const itemPreview = items.length > 0 ? `
    <div style="margin: 24px 0; border: 1px solid #E9ECEF; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="padding: 12px 16px; background-color: #F8F9FA; font-size: 11px; font-weight: 600; color: #868E96; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #E9ECEF;">Shipment Manifest</div>
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
        ${items.map(item => `
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #F8F9FA; vertical-align: middle; width: 44px;">
              <img src="${getEmailImageUrl(item.image)}" width="36" height="36" style="border-radius: 6px; object-fit: cover; display: block; border: 1px solid #E9ECEF;">
            </td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #F8F9FA; font-size: 14px; font-weight: 600; color: #212529; vertical-align: middle;">${item.name}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #F8F9FA; text-align: right; font-size: 13px; color: #868E96; vertical-align: middle;">Qty: ${item.qty}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  ` : '';

  const driverSection = driverInfo ? `
    <div style="margin: 24px 0; border: 1px solid #E9ECEF; border-radius: 12px; padding: 16px 20px; background-color: #F8F9FA;">
      <div style="font-size: 11px; font-weight: 600; color: #868E96; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Delivery Specialist Assigned</div>
      <div style="font-size: 15px; font-weight: 600; color: #212529;">${driverInfo.name}</div>
      <div style="font-size: 13px; color: #111111; font-weight: 600; margin-top: 2px;">Phone: ${driverInfo.phone}</div>
      ${driverInfo.vehicleNumber ? `<div style="font-size: 12px; color: #868E96; margin-top: 4px;">Vehicle detail: ${driverInfo.vehicleType || 'Courier'} &middot; ${driverInfo.vehicleNumber}</div>` : ''}
    </div>
  ` : '';

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 700; color: #111111; letter-spacing: -0.03em;">Order shipment update</h1>
    <p style="margin: 0 0 24px; font-size: 15px; color: #495057; line-height: 1.6;">
      Hi ${name}, the tracking registry indicates that your shipment status has changed.
    </p>

    <div style="display: inline-block; padding: 6px 14px; background-color: ${statusBg}; color: ${statusColor}; border-radius: 8px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 12px; border: 1px solid #E9ECEF;">
      ${status}
    </div>

    ${driverSection}
    ${itemPreview}

    <div style="text-align: left; margin-top: 32px;">
      <a href="${API_URL}/orders/${orderId}" class="btn-hover" style="${btnStyle}">View Order Details</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: ORDERS_SENDER,
      to: email,
      subject: `Your order #${orderId} is ${status.toLowerCase()} — SeaBite`,
      html: emailWrapper(content)
    });
    logEmailSuccess(`STATUS_${status.toUpperCase()}`, email);
    return result;
  } catch (err) {
    logEmailError("STATUS_UPDATE_EMAIL", err, { email, orderId, status });
  }
};

export const sendMarketingEmail = async (email, name, subject, body) => {
  console.log(`🔍 [DEBUG] sendMarketingEmail triggered for: ${email}`);
  if (!resend) return;
  
  const content = `
    <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 700; color: #111111; letter-spacing: -0.03em;">Hello ${name},</h1>
    <div style="color: #495057; line-height: 1.65; font-size: 15px; margin-bottom: 32px;">
      ${body}
    </div>
    <div style="text-align: left;">
      <a href="https://seabite.co.in" class="btn-hover" style="${btnStyle}">Shop Fresh Catches</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: subject,
      html: emailWrapper(content)
    });
    logEmailSuccess("MARKETING", email);
    return result;
  } catch (err) {
    logEmailError("MARKETING_EMAIL", err, { email });
  }
};

/**
 * 5. Back-in-Stock Notification
 */
export const sendWaitlistEmail = async (email, name, productName, productImage) => {
  console.log(`🔍 [DEBUG] sendWaitlistEmail triggered for: ${email} (Product: ${productName})`);
  if (!resend) return;

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 700; color: #111111; letter-spacing: -0.03em;">Back in stock</h1>
    <p style="margin: 0 0 24px; font-size: 15px; color: #495057; line-height: 1.6;">
      Hi ${name}, the catch item you were waiting for has arrived at our regional cold processing facility.
    </p>
    
    <div style="text-align: left; padding: 24px; background-color: #F8F9FA; border: 1px solid #E9ECEF; border-radius: 12px; margin-bottom: 28px;">
      <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 16px;">
        <tr>
          <td>
            <img src="${productImage}" alt="${productName}" style="width: 100px; height: 100px; object-fit: contain; border-radius: 8px; border: 1px solid #E9ECEF; background-color: #ffffff;">
          </td>
          <td style="padding-left: 20px; vertical-align: middle;">
            <div style="font-size: 16px; font-weight: 700; color: #111111; margin-bottom: 4px;">${productName}</div>
            <div style="display: inline-block; padding: 3px 8px; background-color: #E8F5E9; color: #2E7D32; font-size: 11px; font-weight: 600; border-radius: 4px; text-transform: uppercase;">In Stock</div>
          </td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #868E96; margin: 0 0 28px; line-height: 1.5;">
      Stock allocations are highly limited. Complete your order online to secure dispatch.
    </p>

    <div style="text-align: left;">
      <a href="https://seabite.co.in/products" class="btn-hover" style="${btnStyle}">Buy Now</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `${productName} is back in stock — SeaBite`,
      html: emailWrapper(content)
    });
    logEmailSuccess("WAITLIST", email);
    return result;
  } catch (err) {
    logEmailError("WAITLIST_EMAIL", err, { email, productName });
  }
};

/**
 * 7. Generic Support / Custom Email
 */
export const sendEmail = async (to, subject, content) => {
  console.log(`🔍 [DEBUG] sendEmail (generic) triggered for: ${to}`);
  if (!resend) return;

  const html = emailWrapper(content);

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to,
      subject,
      html
    });
    logEmailSuccess("SUPPORT", to);
    return result;
  } catch (err) {
    logEmailError("GENERIC_EMAIL", err, { to });
  }
};

/**
 * 8. Abandoned Cart Recovery
 */
export const sendAbandonedCartEmail = async (email, name, cartItems) => {
  console.log(`🔍 [DEBUG] sendAbandonedCartEmail triggered for: ${email} (Items: ${cartItems?.length})`);
  if (!resend || !cartItems) return;

  const formattedItems = cartItems.map(item => {
    const product = item.product || {};
    const itemName = item.name || product.name || "Premium Item";
    const image = item.image || product.image || "";
    const qty = item.qty || 1;
    
    let price = item.price || 0;
    if (!price && product) {
      const isFlashSale = product.flashSale?.isFlashSale && new Date(product.flashSale.saleEndDate) > new Date();
      price = isFlashSale ? product.flashSale.discountPrice : (product.price || product.basePrice || 0);
    }
    
    return { name: itemName, image, qty, price };
  });

  const cartTotal = formattedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 700; color: #111111; letter-spacing: -0.03em;">Forgot something?</h1>
    <p style="margin: 0 0 28px; font-size: 15px; color: #495057; line-height: 1.6;">
      Hi ${name}, we saved the items you left in your cart. Sourcing is calculated in real-time, and items are only secured once order payment is resolved.
    </p>

    <div style="border: 1px solid #E9ECEF; border-radius: 12px; overflow: hidden; margin-bottom: 28px; background-color: #ffffff;">
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
        ${formattedItems.map(item => `
          <tr>
            <td style="padding: 16px; border-bottom: 1px solid #F8F9FA; vertical-align: middle; width: 44px;">
              ${item.image && !item.image.includes('placeholder') && !item.image.includes('No+Image') ? `
                <img src="${getEmailImageUrl(item.image)}" width="40" height="40" style="border-radius: 6px; object-fit: cover; display: block; border: 1px solid #E9ECEF;">
              ` : `
                <div style="width: 40px; height: 40px; border-radius: 6px; background-color: #F8F9FA; border: 1px solid #E9ECEF; display: flex; align-items: center; justify-content: center;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#868E96" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                  </svg>
                </div>
              `}
            </td>
            <td style="padding: 16px 8px; border-bottom: 1px solid #F8F9FA; vertical-align: middle;">
              <div style="font-size: 14px; font-weight: 600; color: #212529;">${item.name}</div>
              <div style="font-size: 12px; color: #868E96;">Qty: ${item.qty}</div>
            </td>
            <td style="padding: 16px; border-bottom: 1px solid #F8F9FA; text-align: right; vertical-align: middle; font-size: 14px; font-weight: 600; color: #212529;">₹${item.price.toLocaleString()}</td>
          </tr>
        `).join('')}
      </table>
      <div style="padding: 16px; background-color: #FAFBFB; text-align: right; font-size: 14px; border-top: 1px solid #E9ECEF;">
        <span style="color: #868E96;">Total: </span>
        <strong style="color: #111111; font-size: 15px; font-weight: 700;">₹${cartTotal.toLocaleString()}</strong>
      </div>
    </div>

    <div style="text-align: left; margin-bottom: 12px;">
      <a href="${API_URL}/cart" class="btn-hover" style="${btnStyle}">Resume Checkout</a>
    </div>

    <p style="margin: 20px 0 0; font-size: 13px; color: #868E96; line-height: 1.5;">
      Daily seafood stock sells out fast. Complete checkout to avoid missing out on today's catch.
    </p>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `Complete your SeaBite order`,
      html: emailWrapper(content)
    });
    logEmailSuccess("ABANDONED_CART", email);
    return result;
  } catch (err) {
    logEmailError("ABANDONED_CART_EMAIL", err, { email });
  }
};

/**
 * 9. Win-Back Coupon
 */
export const sendWinBackEmail = async (email, name, couponCode) => {
  console.log(`🔍 [DEBUG] sendWinBackEmail triggered for: ${email}`);
  if (!resend) return;

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 700; color: #111111; letter-spacing: -0.03em;">Welcome back to SeaBite</h1>
    <p style="margin: 0 0 24px; font-size: 15px; color: #495057; line-height: 1.6;">
      Hi ${name}, it has been a while since your last fresh delivery. To welcome you back, we've active a special promo credit.
    </p>

    <div style="border: 1px dashed #CED4DA; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px; background-color: #F8F9FA;">
      <div style="font-size: 11px; color: #868E96; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Your Promo Code</div>
      <div style="font-size: 28px; font-weight: 700; color: #111111; letter-spacing: 4px; font-family: SFMono-Regular, Consolas, Monaco, monospace; text-transform: uppercase;">${couponCode}</div>
      <div style="font-size: 13px; color: #2E7D32; font-weight: 600; margin-top: 8px;">15% OFF entire cart &middot; Expires in 48 hours</div>
    </div>

    <div style="text-align: left;">
      <a href="https://seabite.co.in" class="btn-hover" style="${btnStyle}">Redeem Offer</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `Get 15% off your next catch, ${name} | SeaBite`,
      html: emailWrapper(content)
    });
    logEmailSuccess("WIN_BACK", email);
    return result;
  } catch (err) {
    logEmailError("WIN_BACK_EMAIL", err, { email });
  }
};

/**
 * 10. Loyalty Cash Credit
 */
export const sendLoyaltyCreditEmail = async (email, name, amount, reason) => {
  console.log(`🔍 [DEBUG] sendLoyaltyCreditEmail triggered for: ${email}`);
  if (!resend) return;

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 700; color: #111111; letter-spacing: -0.03em;">SeaBite Wallet Credited</h1>
    <p style="margin: 0 0 24px; font-size: 15px; color: #495057; line-height: 1.6;">
      Hi ${name}, ₹${amount} was credited to your SeaBite Cash Balance.
    </p>

    <div style="background-color: #F8F9FA; border: 1px solid #E9ECEF; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
      <div style="font-size: 11px; color: #868E96; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Balance added</div>
      <div style="font-size: 32px; font-weight: 700; color: #2E7D32;">+₹${amount.toLocaleString()}</div>
      <div style="font-size: 13px; color: #868E96; margin-top: 8px;">Reason: ${reason}</div>
    </div>

    <p style="font-size: 13px; color: #868E96; margin: 0 0 28px; line-height: 1.5;">
      Your wallet balance will be automatically available as a payment source during checkout.
    </p>

    <div style="text-align: left;">
      <a href="https://seabite.co.in/profile" class="btn-hover" style="${btnStyle}">Check Wallet</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `₹${amount} SeaBite Cash credited to your wallet`,
      html: emailWrapper(content)
    });
    logEmailSuccess("LOYALTY_CREDIT", email);
    return result;
  } catch (err) {
    logEmailError("LOYALTY_CREDIT_EMAIL", err, { email });
  }
};

/**
 * 11. Admin: Low Inventory Alert
 */
export const sendInventoryAlertEmail = async (adminEmail, productName, stockCount) => {
  console.log(`🔍 [DEBUG] sendInventoryAlertEmail triggered for admin: ${adminEmail} (Product: ${productName})`);
  if (!resend) return;

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #E53E3E;">System: Low Stock Alert</h1>
    <p style="margin: 0 0 24px; font-size: 15px; color: #495057; line-height: 1.6;">
      Inventory levels for <strong>${productName}</strong> have dropped below warning threshold.
    </p>

    <div style="background-color: #FFF5F5; border: 1px solid #FED7D7; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
      <div style="font-size: 11px; color: #C53030; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Current Stock</div>
      <div style="font-size: 32px; font-weight: 700; color: #C53030;">${stockCount} Units</div>
    </div>

    <div style="text-align: left;">
      <a href="https://seabite.co.in/admin/products" class="btn-hover" style="${btnStyle}">Manage Catalog</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: adminEmail,
      subject: `Low stock alert: ${productName} (${stockCount} left) — SeaBite`,
      html: emailWrapper(content)
    });
    logEmailSuccess("INVENTORY_ALERT", adminEmail);
    return result;
  } catch (err) {
    logEmailError("INVENTORY_ALERT_EMAIL", err, { adminEmail, productName });
  }
};

export const sendLowStockAlert = async (email, name, product) => {
  console.log(`🔍 [DEBUG] sendLowStockAlert triggered for: ${email} (Product: ${product.name})`);
  if (!resend) return;

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 700; color: #111111; letter-spacing: -0.03em;">Selling out fast</h1>
    <p style="margin: 0 0 24px; font-size: 15px; color: #495057; line-height: 1.6;">
      Hi ${name}, the item <strong>${product.name}</strong> you recently viewed is running low on stock. Only a few selections remain.
    </p>
    
    <div style="background-color: #FFF5F5; border: 1px solid #FED7D7; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 28px;">
      <div style="font-size: 16px; font-weight: 700; color: #C53030;">Remaining Stock: ${product.countInStock} Units</div>
    </div>

    <div style="text-align: left;">
      <a href="https://seabite.co.in/products/${product._id}" class="btn-hover" style="${btnStyle}">Reserve Now</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `Only ${product.countInStock} left — ${product.name} | SeaBite`,
      html: emailWrapper(content)
    });
    logEmailSuccess("LOW_STOCK_ALERT", email);
    return result;
  } catch (err) {
    logEmailError("LOW_STOCK_ALERT_EMAIL", err, { email, productId: product._id });
  }
};

/**
 * 12. Marketing: Promotional Email
 */
export const sendMarketingPromoEmail = async (email, name, promoData) => {
  const { title, subtitle, image, ctaText, ctaLink, description } = promoData;
  console.log(`🔍 [DEBUG] sendMarketingPromoEmail triggered for: ${email}`);
  if (!resend) return;

  const content = `
    <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #111111; letter-spacing: -0.03em;">${title}</h1>
    <p style="margin: 0 0 24px; font-size: 16px; color: #868E96; font-weight: 500; line-height: 1.4;">${subtitle}</p>
    
    ${image ? `<img src="${image}" alt="${title}" style="width: 100%; border-radius: 12px; margin-bottom: 24px; border: 1px solid #E9ECEF; display: block; max-width: 100%;">` : ''}
    
    <p style="margin: 0 0 32px; font-size: 15px; color: #495057; line-height: 1.65;">
      ${description}
    </p>

    <div style="text-align: left;">
      <a href="${ctaLink || 'https://seabite.co.in'}" class="btn-hover" style="${btnStyle}">${ctaText || 'Shop Catch'}</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `${title} — SeaBite`,
      html: emailWrapper(content)
    });
    logEmailSuccess("MARKETING_PROMO", email);
    return result;
  } catch (err) {
    logEmailError("MARKETING_PROMO_EMAIL", err, { email });
  }
};

/**
 * 13. Batch Marketing
 */
export const sendBatchMarketingEmails = async (users, promoData) => {
  console.log(`🚀 Starting batch marketing to ${users.length} users...`);
  const results = { success: 0, failed: 0 };

  for (const user of users) {
    try {
      await sendMarketingPromoEmail(user.email, user.name, promoData);
      results.success++;
      await new Promise(r => setTimeout(r, 100)); 
    } catch (err) {
      results.failed++;
    }
  }

  console.log(`✅ Batch complete. Success: ${results.success}, Failed: ${results.failed}`);
  return results;
};

/**
 * 6. OTP / Verification Code
 */
export const sendOtpEmail = async (email, otp, type = "VERIFY") => {
  console.log(`🔍 [DEBUG] sendOtpEmail triggered for: ${email} (Type: ${type}, OTP: ${otp})`);
  if (!resend) return;

  let description = "A verification code was requested for your SeaBite account.";
  let heading = "Verification Code";
  let subjectLine = `Your verification code: ${otp} — SeaBite`;
  
  if (type === "FORGOT") {
    description = "A password reset request was received for your SeaBite account.";
    heading = "Reset Password";
    subjectLine = `Password reset code: ${otp} — SeaBite`;
  } else if (type === "SIGNUP") {
    description = "Use this code to verify your email and complete your SeaBite signup.";
    heading = "Confirm Registration";
    subjectLine = `Verify your email: ${otp} — SeaBite`;
  } else if (type === "ADMIN") {
    description = "An admin authorization action was requested. Enter this security code to proceed.";
    heading = "Admin Authorization";
    subjectLine = `Security authorization code: ${otp} — SeaBite`;
  }

  const content = `
    <h1 style="margin: 0 0 12px; font-size: 26px; font-weight: 700; color: #111111; letter-spacing: -0.03em;">${heading}</h1>
    <p style="margin: 0 0 28px; font-size: 15px; color: #495057; line-height: 1.6;">
      ${description}
    </p>
    
    <div style="background-color: #F8F9FA; border: 1px solid #E9ECEF; border-radius: 12px; padding: 36px; text-align: center; margin-bottom: 28px;">
      <div style="font-size: 11px; color: #868E96; margin-bottom: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Security Passcode</div>
      <div style="font-size: 36px; font-weight: 700; color: #111111; letter-spacing: 8px; font-family: SFMono-Regular, Consolas, Monaco, monospace; margin: 0; padding-left: 8px;">
        ${otp}
      </div>
    </div>

    <p style="font-size: 13px; color: #868E96; margin: 0 0 8px; text-align: center; font-weight: 500;">
      This security passcode is valid for 10 minutes. Do not share it with anyone.
    </p>
    <p style="font-size: 13px; color: #CED4DA; margin: 0; text-align: center;">
      If you did not make this request, you can safely ignore this email.
    </p>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: subjectLine,
      html: emailWrapper(content)
    });
    logEmailSuccess(`OTP_${type}`, email);
    return result;
  } catch (err) {
    logEmailError("OTP_EMAIL", err, { email, type });
  }
};