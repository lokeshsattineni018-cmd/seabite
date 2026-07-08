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
 * Premium SeaBite Ocean Aesthetic Wrapper
 * Modeled with high-end typography, modern gradients, CSS keyframe animations, 
 * and custom-coded modular components. Fully compatible with modern email clients.
 */
const emailWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SeaBite</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
    
    /* Standard reset */
    body {
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #F5F5F7;
      color: #1D1D1F;
      -webkit-font-smoothing: antialiased;
    }
    
    /* Elegant transition & entrance keyframe animations */
    @keyframes emailEntrance {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes pulseShadow {
      0% { box-shadow: 0 0 0 0 rgba(91, 168, 160, 0.5); }
      70% { box-shadow: 0 0 0 10px rgba(91, 168, 160, 0); }
      100% { box-shadow: 0 0 0 0 rgba(91, 168, 160, 0); }
    }
    
    .animated-wrapper {
      animation: emailEntrance 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    
    .btn-pulse {
      animation: pulseShadow 2.5s infinite;
    }

    /* Hover treatments for compatible clients */
    .hover-grow:hover {
      transform: scale(1.03);
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5F7; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F5F7; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" class="animated-wrapper" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 16px 48px rgba(10,37,64,0.06); border: 1px solid rgba(142,165,179,0.15);">
          <!-- Brand Header with Premium Deep Ocean Gradient -->
          <tr>
            <td style="padding: 36px 40px; background: linear-gradient(135deg, #0A2540 0%, #1A3E5C 100%); text-align: center; border-bottom: 4px solid #5BA8A0;">
              <img src="${LOGO_URL}" alt="SeaBite" width="130" style="display: block; margin: 0 auto; max-width: 130px; filter: brightness(0) invert(1);">
            </td>
          </tr>
          <!-- Body Content Area -->
          <tr>
            <td style="padding: 48px 40px 40px; line-height: 1.65; font-size: 15px; color: #1D1D1F;">
              ${content}
            </td>
          </tr>
          <!-- Premium Information Footer -->
          <tr>
            <td style="padding: 36px 40px; background-color: #FAFAFB; border-top: 1px solid #E8E8ED; font-size: 12px; color: #86868B; line-height: 1.6; text-align: center;">
              <p style="margin: 0 0 6px; font-weight: 700; color: #0A2540; letter-spacing: 0.05em; text-transform: uppercase;">SeaBite Fresh Catch</p>
              <p style="margin: 0 0 16px;">Mogalthur, 534281, West Godavari, Andhra Pradesh, India</p>
              <p style="margin: 0 0 20px;">Sourced fresh at 4 AM directly from the coast, delivered to your door by noon.</p>
              <table role="presentation" align="center" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td><a href="${API_URL}/privacy" style="color: #0071E3; text-decoration: none; font-weight: 600; margin: 0 10px;">Privacy Policy</a></td>
                  <td style="color: #A1A1A6;">&bull;</td>
                  <td><a href="${API_URL}/terms" style="color: #0071E3; text-decoration: none; font-weight: 600; margin: 0 10px;">Terms of Service</a></td>
                  <td style="color: #A1A1A6;">&bull;</td>
                  <td><a href="mailto:support@seabite.co.in" style="color: #0071E3; text-decoration: none; font-weight: 600; margin: 0 10px;">Support</a></td>
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

// Shared SASS-like Inline Button Styles
const btnStyle = `display: inline-block; padding: 14px 32px; background-color: #5BA8A0; color: #ffffff; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 14px; letter-spacing: 0.03em; box-shadow: 0 6px 20px rgba(91,168,160,0.3); text-transform: uppercase; text-align: center; border: none; transition: transform 0.2s;`;
const btnStyleOutline = `display: inline-block; padding: 13px 31px; background-color: #ffffff; color: #1D1D1F; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 14px; border: 1px solid #E8E8ED; letter-spacing: 0.03em; text-transform: uppercase; text-align: center; transition: transform 0.2s;`;

/**
 * 1. AUTH: Login / Welcome
 */
export const sendAuthEmail = async (email, name, isNewUser = false) => {
  console.log(`🔍 [DEBUG] sendAuthEmail triggered for: ${email} (NewUser: ${isNewUser})`);
  if (!resend) return console.log("⚠️ Email skipped: Missing RESEND_API_KEY");

  const istTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", timeStyle: "short", dateStyle: "medium" });

  const content = isNewUser ? `
    <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 800; color: #1D1D1F; letter-spacing: -0.02em;">Welcome to SeaBite, ${name}</h1>
    <p style="margin: 0 0 24px; font-size: 16px; color: #86868B; line-height: 1.6;">
      Your account is ready. Get ready to experience ultra-fresh seafood sourced directly from local fisherman, processed under hygienic conditions, and delivered straight to your home.
    </p>
    
    <div style="background-color: #F5F5F7; border-radius: 18px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #5BA8A0;">
      <h3 style="margin: 0 0 6px; font-size: 15px; font-weight: 700; color: #1D1D1F;">The SeaBite Standard</h3>
      <p style="margin: 0; font-size: 14px; color: #86868B; line-height: 1.5;">We source daily catches at 4 AM and complete last-mile deliveries before noon, maintaining an uninterrupted cold chain.</p>
    </div>

    <div style="text-align: center;">
      <a href="${API_URL}" class="btn-pulse hover-grow" style="${btnStyle}">Explore Today's Catch</a>
    </div>
  ` : `
    <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 800; color: #1D1D1F; letter-spacing: -0.02em;">Security Alert: New Sign-In</h1>
    <p style="margin: 0 0 24px; font-size: 16px; color: #86868B; line-height: 1.6;">
      Hello ${name}, we detected a successful sign-in to your SeaBite account.
    </p>

    <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F5F7; border-radius: 18px; padding: 20px; margin-bottom: 32px; border: 1px solid #E8E8ED;">
      <tr>
        <td style="font-size: 14px; color: #86868B; padding-bottom: 8px;">Time</td>
        <td style="font-size: 14px; color: #1D1D1F; font-weight: 600; text-align: right; padding-bottom: 8px;">${istTime} IST</td>
      </tr>
      <tr>
        <td style="font-size: 14px; color: #86868B;">Sign-In Method</td>
        <td style="font-size: 14px; color: #1D1D1F; font-weight: 600; text-align: right;">Email / OTP code</td>
      </tr>
    </table>

    <p style="margin: 0 0 32px; font-size: 14px; color: #86868B; line-height: 1.6;">
      If this request was initiated by you, no action is required. If you did not sign in, please secure your account by contacting support immediately.
    </p>

    <div style="text-align: center;">
      <a href="${API_URL}" class="hover-grow" style="${btnStyle}">Go to Account</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: isNewUser ? `Welcome to SeaBite, ${name}!` : 'Sign-in security alert — SeaBite',
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
      <td style="padding: 16px 0; border-bottom: 1px solid #E8E8ED; vertical-align: top; width: 64px;">
        <img src="${getEmailImageUrl(item.image)}" width="52" height="52" style="border-radius: 10px; object-fit: cover; display: block; border: 1px solid #E8E8ED;">
      </td>
      <td style="padding: 16px 16px; border-bottom: 1px solid #E8E8ED; vertical-align: top;">
        <div style="font-size: 15px; font-weight: 700; color: #1D1D1F; margin-bottom: 4px;">${item.name}</div>
        <div style="font-size: 13px; color: #86868B; font-weight: 500;">Qty: ${item.qty} &times; ₹${item.price.toLocaleString()}</div>
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid #E8E8ED; text-align: right; font-size: 15px; font-weight: 700; color: #1D1D1F; vertical-align: top;">₹${(item.price * item.qty).toLocaleString()}</td>
    </tr>
  `).join('');

  const content = `
    <!-- Minimalist SVG Checkmark -->
    <div style="text-align: center; margin-bottom: 36px;">
      <div style="width: 64px; height: 64px; border-radius: 50%; background-color: #EAF2F1; margin: 0 auto 16px; line-height: 64px; text-align: center;">
        <span style="display: inline-block; vertical-align: middle; line-height: 1;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5BA8A0" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin-top: 20px;">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
      </div>
      <h1 style="margin: 0 0 6px; font-size: 26px; font-weight: 800; color: #1D1D1F; letter-spacing: -0.02em;">Order Confirmed</h1>
      <p style="margin: 0; font-size: 14px; color: #86868B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;">Order #${orderId} &bull; ${isCOD ? 'Cash on Delivery' : 'Paid Online'}</p>
    </div>

    <p style="font-size: 15px; color: #86868B; line-height: 1.6; margin: 0 0 32px;">
      Hi ${name}, thank you for choosing SeaBite. Your order has been registered, and our processing facility at the Mogalthur coast is preparing your fresh selection.
    </p>

    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px;">
      ${itemRows}
    </table>

    <!-- Pricing Summary Card -->
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 32px;">
      <tr>
        <td style="padding: 10px 0; font-size: 14px; color: #86868B; font-weight: 500;">Subtotal</td>
        <td style="padding: 10px 0; text-align: right; font-size: 14px; color: #1D1D1F; font-weight: 600;">₹${subtotal.toLocaleString()}</td>
      </tr>
      ${discount > 0 ? `
      <tr>
        <td style="padding: 10px 0; font-size: 14px; color: #5BA8A0; font-weight: 700;">Applied Discounts</td>
        <td style="padding: 10px 0; text-align: right; font-size: 14px; color: #5BA8A0; font-weight: 700;">-₹${discount.toLocaleString()}</td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 10px 0; font-size: 14px; color: #86868B; font-weight: 500;">Delivery Service Charge</td>
        <td style="padding: 10px 0; text-align: right; font-size: 14px; color: ${shippingPrice > 0 ? '#1D1D1F' : '#5BA8A0'}; font-weight: 600;">${shippingPrice > 0 ? `₹${shippingPrice.toLocaleString()}` : 'Free'}</td>
      </tr>
      ${taxPrice > 0 ? `
      <tr>
        <td style="padding: 10px 0; font-size: 14px; color: #86868B; font-weight: 500;">GST (5%)</td>
        <td style="padding: 10px 0; text-align: right; font-size: 14px; color: #1D1D1F; font-weight: 600;">₹${taxPrice.toLocaleString()}</td>
      </tr>
      ` : ''}
      <tr>
        <td colspan="2" style="padding: 8px 0 12px; border-bottom: 2px solid #1D1D1F;"></td>
      </tr>
      <tr>
        <td style="padding: 16px 0 0; font-size: 16px; font-weight: 800; color: #1D1D1F;">${isCOD ? 'Total Amount to Pay' : 'Total Amount Paid'}</td>
        <td style="padding: 16px 0 0; text-align: right; font-size: 20px; font-weight: 800; color: #1D1D1F;">₹${total.toLocaleString()}</td>
      </tr>
    </table>

    <div style="background-color: #F5F5F7; border-radius: 18px; padding: 20px; margin-bottom: 36px; border: 1px solid #E8E8ED; text-align: center;">
      <div style="font-size: 11px; font-weight: 700; color: #86868B; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">Delivery Slot Schedule</div>
      <div style="font-size: 16px; font-weight: 700; color: #1D1D1F;">24 Hours Cold Chain Delivery</div>
    </div>

    <div style="text-align: center;">
      <a href="${API_URL}/orders/${orderId}" class="btn-pulse hover-grow" style="${btnStyle}">Track Your Order</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: ORDERS_SENDER,
      to: email,
      subject: `Order confirmation — #${orderId} | SeaBite`,
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
  const statusColor = isDelivered ? '#5BA8A0' : '#0071E3';
  const statusBg = isDelivered ? '#EAF2F1' : '#E6F0FA';

  const itemPreview = items.length > 0 ? `
    <div style="margin: 28px 0; border: 1px solid #E8E8ED; border-radius: 18px; overflow: hidden; background-color: #ffffff;">
      <div style="padding: 14px 20px; background-color: #F5F5F7; font-size: 11px; font-weight: 700; color: #86868B; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid #E8E8ED;">Items in this Shipment</div>
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
        ${items.map(item => `
          <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #F5F5F7; vertical-align: middle; width: 44px;">
              <img src="${getEmailImageUrl(item.image)}" width="38" height="38" style="border-radius: 8px; object-fit: cover; display: block; border: 1px solid #E8E8ED;">
            </td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #F5F5F7; font-size: 14px; font-weight: 700; color: #1D1D1F; vertical-align: middle;">${item.name}</td>
            <td style="padding: 12px 20px; border-bottom: 1px solid #F5F5F7; text-align: right; font-size: 13px; color: #86868B; font-weight: 600; vertical-align: middle;">Qty: ${item.qty}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  ` : '';

  const driverSection = driverInfo ? `
    <div style="margin: 28px 0; border: 1px solid #E8E8ED; border-radius: 18px; padding: 20px; background-color: #F5F5F7;">
      <div style="font-size: 11px; font-weight: 700; color: #86868B; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">Delivery Specialist</div>
      <div style="font-size: 16px; font-weight: 700; color: #1D1D1F;">${driverInfo.name}</div>
      <div style="font-size: 14px; color: #0071E3; font-weight: 700; margin-top: 2px;">${driverInfo.phone}</div>
      ${driverInfo.vehicleNumber ? `<div style="font-size: 13px; color: #86868B; margin-top: 4px; font-weight: 500;">${driverInfo.vehicleType || 'Vehicle'}: ${driverInfo.vehicleNumber}</div>` : ''}
    </div>
  ` : '';

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 800; color: #1D1D1F; letter-spacing: -0.02em;">Order Status Updated</h1>
    <p style="margin: 0 0 24px; font-size: 16px; color: #86868B; line-height: 1.6;">
      Hi ${name}, the processing team has updated the status of your order.
    </p>

    <div style="display: inline-block; padding: 8px 18px; background-color: ${statusBg}; color: ${statusColor}; border-radius: 12px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; border: 1px solid rgba(0,0,0,0.03);">
      ${status}
    </div>

    ${driverSection}
    ${itemPreview}

    <div style="text-align: center; margin-top: 36px;">
      <a href="${API_URL}/orders/${orderId}" class="hover-grow" style="${btnStyle}">View Order Details</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: ORDERS_SENDER,
      to: email,
      subject: `Order status update — #${orderId} is ${status.toLowerCase()} | SeaBite`,
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
    <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 800; color: #1D1D1F; letter-spacing: -0.02em;">Hello ${name},</h1>
    <div style="color: #86868B; line-height: 1.7; font-size: 15px; margin-bottom: 32px;">
      ${body}
    </div>
    <div style="text-align: center;">
      <a href="https://seabite.co.in" class="hover-grow" style="${btnStyle}">Shop Fresh Catches</a>
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
    <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 800; color: #1D1D1F; letter-spacing: -0.02em;">Now Back in Stock</h1>
    <p style="margin: 0 0 28px; font-size: 16px; color: #86868B; line-height: 1.6;">
      Hi ${name}, the fresh item you requested is back in stock at our Mogalthur coast processing facility.
    </p>
    
    <div style="text-align: center; padding: 32px; background-color: #F5F5F7; border: 1px solid #E8E8ED; border-radius: 20px; margin-bottom: 32px;">
      <img src="${productImage}" alt="${productName}" style="width: 140px; height: 140px; object-fit: contain; margin-bottom: 20px; border-radius: 12px; border: 1px solid #E8E8ED; background-color:#ffffff;">
      <div style="font-size: 18px; font-weight: 800; color: #1D1D1F; margin-bottom: 6px;">${productName}</div>
      <div style="display: inline-block; padding: 4px 12px; background-color: #EAF2F1; color: #5BA8A0; font-size: 12px; font-weight: 700; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.04em;">Ready for Dispatch</div>
    </div>

    <p style="font-size: 14px; color: #86868B; margin: 0 0 28px; line-height: 1.5; text-align: center;">
      Catches are highly limited and sold on a first-come, first-served basis. Order soon to secure your allocation.
    </p>

    <div style="text-align: center;">
      <a href="https://seabite.co.in/products" class="btn-pulse hover-grow" style="${btnStyle}">Order Now</a>
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
    <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 800; color: #1D1D1F; letter-spacing: -0.02em;">Items Left in Cart</h1>
    <p style="margin: 0 0 28px; font-size: 16px; color: #86868B; line-height: 1.6;">
      Hi ${name}, you left items in your shopping cart. Your premium selection is reserved and prepared, but fresh catches sell out fast.
    </p>

    <div style="border: 1px solid #E8E8ED; border-radius: 18px; overflow: hidden; margin-bottom: 32px; background-color: #ffffff;">
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
        ${formattedItems.map(item => `
          <tr>
            <td style="padding: 16px; border-bottom: 1px solid #F5F5F7; vertical-align: middle; width: 44px;">
              ${item.image && !item.image.includes('placeholder') && !item.image.includes('No+Image') ? `
                <img src="${getEmailImageUrl(item.image)}" width="40" height="40" style="border-radius: 6px; object-fit: cover; display: block; border: 1px solid #E8E8ED;">
              ` : `
                <div style="width: 40px; height: 40px; border-radius: 6px; background-color: #F5F5F7; border: 1px solid #E8E8ED; display: flex; align-items: center; justify-content: center;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5BA8A0" stroke-width="2.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                  </svg>
                </div>
              `}
            </td>
            <td style="padding: 16px 8px; border-bottom: 1px solid #F5F5F7; vertical-align: middle;">
              <div style="font-size: 14px; font-weight: 700; color: #1D1D1F;">${item.name}</div>
              <div style="font-size: 13px; color: #86868B; font-weight: 500;">Qty: ${item.qty}</div>
            </td>
            <td style="padding: 16px; border-bottom: 1px solid #F5F5F7; text-align: right; vertical-align: middle; font-size: 14px; font-weight: 700; color: #1D1D1F;">₹${item.price.toLocaleString()}</td>
          </tr>
        `).join('')}
      </table>
      <div style="padding: 16px; background-color: #FAFAFB; text-align: right; font-size: 14px; border-top: 1px solid #E8E8ED;">
        <span style="color: #86868B; font-weight: 500;">Subtotal Value: </span>
        <strong style="color: #1D1D1F; font-size: 16px; font-weight: 800;">₹${cartTotal.toLocaleString()}</strong>
      </div>
    </div>

    <div style="text-align: center; margin-bottom: 16px;">
      <a href="${API_URL}/cart" class="btn-pulse hover-grow" style="${btnStyle}">Complete Checkout</a>
    </div>

    <p style="margin: 24px 0 0; font-size: 13px; color: #86868B; text-align: center; line-height: 1.5;">
      Catches are updated daily at 4 AM based on active fishing operations. Complete checkout to confirm your reservation.
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
    <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 800; color: #1D1D1F; letter-spacing: -0.02em;">We Miss You</h1>
    <p style="margin: 0 0 28px; font-size: 16px; color: #86868B; line-height: 1.6;">
      Hello ${name}, it has been a while since you enjoyed a fresh catch from Mogalthur. To welcome you back, we have credited a premium discount code to your profile.
    </p>

    <div style="border: 2px dashed #5BA8A0; border-radius: 18px; padding: 32px; text-align: center; margin-bottom: 28px; background-color: #FAFAFB; box-shadow: 0 4px 12px rgba(91,168,160,0.04);">
      <div style="font-size: 11px; color: #86868B; margin-bottom: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">Exclusive Code</div>
      <div style="font-size: 32px; font-weight: 800; color: #1D1D1F; letter-spacing: 6px; font-family: 'Courier New', monospace; text-transform: uppercase;">${couponCode}</div>
      <div style="font-size: 14px; color: #5BA8A0; font-weight: 700; margin-top: 12px; text-transform: uppercase; letter-spacing: 0.04em;">15% Off Your Entire Cart &bull; Valid for 48 Hours</div>
    </div>

    <p style="font-size: 14px; color: #86868B; margin: 0 0 32px; text-align: center; line-height: 1.5;">
      Apply this code during checkout. Compatible with wallet balance redemptions.
    </p>

    <div style="text-align: center;">
      <a href="https://seabite.co.in" class="hover-grow" style="${btnStyle}">Activate Offer</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `We want to welcome you back — SeaBite`,
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
    <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 800; color: #1D1D1F; letter-spacing: -0.02em;">SeaBite Cash Credited</h1>
    <p style="margin: 0 0 28px; font-size: 16px; color: #86868B; line-height: 1.6;">
      Hi ${name}, a promotional credit of ₹${amount} has been added directly to your digital SeaBite Wallet.
    </p>

    <div style="background-color: #F5F5F7; border: 1px solid #E8E8ED; border-radius: 20px; padding: 28px; text-align: center; margin-bottom: 28px;">
      <div style="font-size: 11px; color: #86868B; margin-bottom: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">Credit Added</div>
      <div style="font-size: 36px; font-weight: 800; color: #5BA8A0;">+₹${amount.toLocaleString()}</div>
      <div style="font-size: 13px; color: #86868B; margin-top: 10px; font-weight: 600;">Reason: ${reason}</div>
    </div>

    <p style="font-size: 14px; color: #86868B; margin: 0 0 32px; line-height: 1.5;">
      Your wallet balance is active and will be automatically displayed as a payment option on checkout.
    </p>

    <div style="text-align: center;">
      <a href="https://seabite.co.in/profile" class="hover-grow" style="${btnStyle}">View Wallet Balance</a>
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
    <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 800; color: #1D1D1F; letter-spacing: -0.02em;">System Alert: Low Inventory</h1>
    <p style="margin: 0 0 28px; font-size: 16px; color: #86868B; line-height: 1.6;">
      System registry indicates that the inventory level for <strong>${productName}</strong> has dropped below threshold.
    </p>

    <div style="background-color: #FFF5F5; border: 1px solid #FFE3E3; border-radius: 20px; padding: 28px; text-align: center; margin-bottom: 28px;">
      <div style="font-size: 11px; color: #E53E3E; margin-bottom: 6px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">Active Inventory</div>
      <div style="font-size: 36px; font-weight: 800; color: #E53E3E;">${stockCount} Units</div>
    </div>

    <div style="text-align: center;">
      <a href="https://seabite.co.in/admin/products" class="hover-grow" style="${btnStyle}">Restock Catalog</a>
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
    <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 800; color: #1D1D1F; letter-spacing: -0.02em;">Almost Sold Out</h1>
    <p style="margin: 0 0 28px; font-size: 16px; color: #86868B; line-height: 1.6;">
      Hi ${name}, the catch you viewed, <strong>${product.name}</strong>, is selling out rapidly. Only a few allocations remain at our regional cold storage.
    </p>
    
    <div style="background-color: #FFF5F5; border: 1px solid #FFE3E3; border-radius: 20px; padding: 24px; text-align: center; margin-bottom: 28px;">
      <div style="font-size: 18px; font-weight: 800; color: #E53E3E;">Remaining Units: ${product.countInStock}</div>
    </div>

    <div style="text-align: center;">
      <a href="https://seabite.co.in/products/${product._id}" class="btn-pulse hover-grow" style="${btnStyle}">Buy Now</a>
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
    <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 800; color: #1D1D1F; letter-spacing: -0.02em;">${title}</h1>
    <p style="margin: 0 0 24px; font-size: 17px; color: #86868B; font-weight: 600; line-height: 1.4;">${subtitle}</p>
    
    ${image ? `<img src="${image}" alt="${title}" style="width: 100%; border-radius: 18px; margin-bottom: 24px; border: 1px solid #E8E8ED; display: block; max-width: 100%;">` : ''}
    
    <p style="margin: 0 0 32px; font-size: 15px; color: #86868B; line-height: 1.7;">
      ${description}
    </p>

    <div style="text-align: center;">
      <a href="${ctaLink || 'https://seabite.co.in'}" class="btn-pulse hover-grow" style="${btnStyle}">${ctaText || 'Shop Collection'}</a>
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
    description = "Please use this verification code to confirm your email and complete your SeaBite signup.";
    heading = "Confirm Registration";
    subjectLine = `Verify your email: ${otp} — SeaBite`;
  } else if (type === "ADMIN") {
    description = "An admin authorization action was requested. Enter this security code to proceed.";
    heading = "Admin Authorization";
    subjectLine = `Security authorization code: ${otp} — SeaBite`;
  }

  const content = `
    <h1 style="margin: 0 0 12px; font-size: 26px; font-weight: 800; color: #1D1D1F; letter-spacing: -0.02em;">${heading}</h1>
    <p style="margin: 0 0 28px; font-size: 15px; color: #86868B; line-height: 1.6;">
      ${description}
    </p>
    
    <div style="background: linear-gradient(135deg, #0A2540 0%, #1A3E5C 100%); border-radius: 20px; padding: 36px; text-align: center; margin-bottom: 28px; box-shadow: 0 8px 24px rgba(10,37,64,0.12);">
      <div style="font-size: 11px; color: #5BA8A0; margin-bottom: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Verification Code</div>
      <div style="font-size: 40px; font-weight: 800; color: #FFFFFF; letter-spacing: 12px; font-family: 'Courier New', monospace; margin: 0; padding-left: 12px;">
        ${otp}
      </div>
    </div>

    <p style="font-size: 13px; color: #86868B; margin: 0 0 8px; text-align: center; font-weight: 500;">
      This secure code is valid for 10 minutes. Do not share it with anyone.
    </p>
    <p style="font-size: 13px; color: #A1A1A6; margin: 0; text-align: center;">
      If you did not make this request, you can safely disregard this message.
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