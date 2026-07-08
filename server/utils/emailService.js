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
 * Clean E-commerce Email Wrapper
 * Modeled after Amazon, Flipkart, and Swiggy transactional emails.
 * No decorative badges. No flashy gradients. Just clean, readable content.
 */
const emailWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SeaBite</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1f2937; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #e5e7eb;">
              <img src="${LOGO_URL}" alt="SeaBite" width="110" style="display: block;">
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px; line-height: 1.6;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; line-height: 1.5;">
              <p style="margin: 0 0 4px;">SeaBite &middot; Mogalthur, 534281, West Godavari, AP</p>
              <p style="margin: 0 0 8px;">&copy; 2026 SeaBite. All rights reserved.</p>
              <p style="margin: 0;">
                <a href="https://seabite.co.in/privacy" style="color: #6b7280; text-decoration: underline;">Privacy Policy</a> &middot;
                <a href="https://seabite.co.in/terms" style="color: #6b7280; text-decoration: underline;">Terms of Service</a> &middot;
                <a href="mailto:support@seabite.co.in" style="color: #6b7280; text-decoration: underline;">Contact Support</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Reusable button style
const btnStyle = `display: inline-block; padding: 12px 28px; background-color: #1a2e2c; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;`;
const btnStyleOutline = `display: inline-block; padding: 12px 28px; background-color: #ffffff; color: #1a2e2c; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; border: 1px solid #d1d5db;`;

/**
 * 1. AUTH: Login / Welcome
 */
export const sendAuthEmail = async (email, name, isNewUser = false) => {
  console.log(`🔍 [DEBUG] sendAuthEmail triggered for: ${email} (NewUser: ${isNewUser})`);
  if (!resend) return console.log("⚠️ Email skipped: Missing RESEND_API_KEY");

  const istTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", timeStyle: "short", dateStyle: "medium" });

  const content = isNewUser ? `
    <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #111827;">Welcome to SeaBite, ${name}!</h2>
    <p style="margin: 0 0 20px; font-size: 15px; color: #4b5563;">
      Your account has been created successfully. You now have access to the freshest seafood delivered straight from Mogalthur coast.
    </p>
    <p style="margin: 0 0 28px; font-size: 15px; color: #4b5563;">
      Start browsing our daily catch — we source at 4 AM and deliver by noon.
    </p>
    <a href="https://seabite.co.in" style="${btnStyle}">Start Shopping</a>
  ` : `
    <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #111827;">Hi ${name},</h2>
    <p style="margin: 0 0 20px; font-size: 15px; color: #4b5563;">
      You signed in to your SeaBite account on <strong>${istTime} IST</strong>.
    </p>
    <p style="margin: 0 0 28px; font-size: 15px; color: #4b5563;">
      If this was you, no action is needed. If you didn't sign in, please
      <a href="mailto:support@seabite.co.in" style="color: #2563eb;">contact our support team</a> immediately.
    </p>
    <a href="https://seabite.co.in" style="${btnStyle}">Go to SeaBite</a>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: isNewUser ? `Welcome to SeaBite, ${name}!` : 'Sign-in notification — SeaBite',
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
  
  // Calculate pricing values with a dynamic database fetch fallback
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
      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; vertical-align: top; width: 56px;">
        <img src="${getEmailImageUrl(item.image)}" width="48" height="48" style="border-radius: 6px; object-fit: cover; display: block; border: 1px solid #e5e7eb;">
      </td>
      <td style="padding: 12px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: top;">
        <div style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 2px;">${item.name}</div>
        <div style="font-size: 13px; color: #6b7280;">Qty: ${item.qty} &times; ₹${item.price}</div>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-size: 14px; font-weight: 600; color: #111827; vertical-align: top;">₹${(item.price * item.qty).toLocaleString()}</td>
    </tr>
  `).join('');

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="width: 48px; height: 48px; border-radius: 50%; background-color: #d1fae5; margin: 0 auto 12px; line-height: 48px; font-size: 24px;">✓</div>
      <h2 style="margin: 0 0 4px; font-size: 22px; font-weight: 700; color: #111827;">Order Confirmed</h2>
      <p style="margin: 0; font-size: 14px; color: #6b7280;">Order #${orderId} &middot; ${isCOD ? 'Cash on Delivery' : 'Paid Online'}</p>
    </div>

    <p style="font-size: 15px; color: #4b5563; margin: 0 0 24px;">
      Hi ${name}, thanks for your order! We've received it and our team at Mogalthur is getting your fresh catch ready.
    </p>

    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 16px;">
      ${itemRows}
    </table>

    <!-- Price Summary -->
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Subtotal</td>
        <td style="padding: 8px 0; text-align: right; font-size: 14px; color: #111827;">₹${subtotal.toLocaleString()}</td>
      </tr>
      ${discount > 0 ? `
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #059669;">Discount</td>
        <td style="padding: 8px 0; text-align: right; font-size: 14px; color: #059669;">-₹${discount.toLocaleString()}</td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Delivery</td>
        <td style="padding: 8px 0; text-align: right; font-size: 14px; color: ${shippingPrice > 0 ? '#111827' : '#059669'};">${shippingPrice > 0 ? `₹${shippingPrice.toLocaleString()}` : 'Free'}</td>
      </tr>
      ${taxPrice > 0 ? `
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Tax (5% GST)</td>
        <td style="padding: 8px 0; text-align: right; font-size: 14px; color: #111827;">₹${taxPrice.toLocaleString()}</td>
      </tr>
      ` : ''}
      <tr>
        <td colspan="2" style="padding: 0; border-bottom: 1px solid #e5e7eb;"></td>
      </tr>
      <tr>
        <td style="padding: 12px 0 0; font-size: 16px; font-weight: 700; color: #111827;">${isCOD ? 'Amount to Pay' : 'Total Paid'}</td>
        <td style="padding: 12px 0 0; text-align: right; font-size: 18px; font-weight: 700; color: #111827;">₹${total.toLocaleString()}</td>
      </tr>
    </table>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 28px;">
      <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">Estimated Delivery</div>
      <div style="font-size: 15px; font-weight: 600; color: #111827;">2–3 Business Days</div>
    </div>

    <div style="text-align: center;">
      <a href="${API_URL}/orders/${orderId}" style="${btnStyle}">Track Order</a>
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
  const statusColor = isDelivered ? '#059669' : '#2563eb';
  const statusBg = isDelivered ? '#d1fae5' : '#dbeafe';
  const statusIcon = isDelivered ? '📦' : (status === 'Shipped' || status === 'On The Way' ? '🚚' : '📋');

  const itemPreview = items.length > 0 ? `
    <div style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="padding: 10px 16px; background-color: #f9fafb; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #e5e7eb;">Items in this order</div>
      <table width="100%" cellspacing="0" cellpadding="0">
        ${items.map(item => `
          <tr>
            <td style="padding: 10px 16px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; width: 40px;">
              <img src="${getEmailImageUrl(item.image)}" width="36" height="36" style="border-radius: 4px; object-fit: cover; display: block; border: 1px solid #e5e7eb;">
            </td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f3f4f6; font-size: 14px; font-weight: 500; color: #111827;">${item.name}</td>
            <td style="padding: 10px 16px; border-bottom: 1px solid #f3f4f6; text-align: right; font-size: 13px; color: #6b7280;">Qty: ${item.qty}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  ` : '';

  const driverSection = driverInfo ? `
    <div style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
      <div style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px;">Delivery Partner</div>
      <div style="font-size: 15px; font-weight: 600; color: #111827;">${driverInfo.name}</div>
      <div style="font-size: 14px; color: #2563eb; margin-top: 2px;">${driverInfo.phone}</div>
      ${driverInfo.vehicleNumber ? `<div style="font-size: 13px; color: #6b7280; margin-top: 2px;">${driverInfo.vehicleType || 'Vehicle'}: ${driverInfo.vehicleNumber}</div>` : ''}
    </div>
  ` : '';

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #111827;">
      ${statusIcon} Order #${orderId} — ${status}
    </h2>
    <p style="margin: 0 0 20px; font-size: 15px; color: #4b5563;">
      Hi ${name}, here's an update on your order.
    </p>

    <div style="display: inline-block; padding: 6px 14px; background-color: ${statusBg}; color: ${statusColor}; border-radius: 4px; font-weight: 600; font-size: 13px; margin-bottom: 20px;">
      Status: ${status}
    </div>

    ${driverSection}
    ${itemPreview}

    <div style="text-align: center; margin-top: 28px;">
      <a href="${API_URL}/orders/${orderId}" style="${btnStyle}">View Order Details</a>
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
    <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #111827;">
      Hi ${name},
    </h2>
    <div style="color: #4b5563; line-height: 1.7; font-size: 15px; margin-bottom: 28px;">
      ${body}
    </div>
    <div style="text-align: center;">
      <a href="https://seabite.co.in" style="${btnStyle}">Shop Now</a>
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
    <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #111827;">Good news, ${name}!</h2>
    <p style="margin: 0 0 24px; font-size: 15px; color: #4b5563;">
      <strong>${productName}</strong> is back in stock. You asked us to notify you, so here we are.
    </p>
    
    <div style="text-align: center; padding: 24px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 24px;">
      <img src="${productImage}" alt="${productName}" style="width: 120px; height: 120px; object-fit: contain; margin-bottom: 16px; border-radius: 8px;">
      <div style="font-size: 16px; font-weight: 600; color: #111827;">${productName}</div>
      <div style="font-size: 13px; color: #059669; margin-top: 4px; font-weight: 500;">✓ In Stock</div>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px;">
      Stock is limited and sells out fast. We recommend ordering soon.
    </p>

    <div style="text-align: center;">
      <a href="https://seabite.co.in/products" style="${btnStyle}">Buy Now</a>
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
 * 6. OTP / Verification Code
 */
export const sendOtpEmail = async (email, otp, type = "VERIFY") => {
  console.log(`🔍 [DEBUG] sendOtpEmail triggered for: ${email} (Type: ${type}, OTP: ${otp})`);
  if (!resend) return;

  let description = "A verification code was requested for your SeaBite account.";
  let heading = "Your verification code";
  let subjectLine = `Your verification code: ${otp} — SeaBite`;
  
  if (type === "FORGOT") {
    description = "You requested a password reset for your SeaBite account.";
    heading = "Reset your password";
    subjectLine = `Password reset code: ${otp} — SeaBite`;
  } else if (type === "SIGNUP") {
    description = "Please verify your email address to complete your SeaBite account setup.";
    heading = "Verify your email";
    subjectLine = `Verify your email: ${otp} — SeaBite`;
  } else if (type === "ADMIN") {
    description = "An admin action was requested for your SeaBite store. Use this code to proceed.";
    heading = "Admin verification";
    subjectLine = `Admin security code: ${otp} — SeaBite`;
  }

  const content = `
    <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #111827;">${heading}</h2>
    <p style="margin: 0 0 28px; font-size: 15px; color: #4b5563;">
      ${description}
    </p>
    
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 28px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px; font-weight: 500;">Your code</div>
      <div style="font-size: 36px; font-weight: 700; color: #111827; letter-spacing: 8px; font-family: 'Courier New', monospace;">
        ${otp}
      </div>
    </div>

    <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px; text-align: center;">
      This code expires in 10 minutes. Do not share it with anyone.
    </p>
    <p style="font-size: 13px; color: #9ca3af; margin: 0; text-align: center;">
      If you didn't request this, you can safely ignore this email.
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

  // Modern mapper supporting both raw and pre-populated schema variants
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
    <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #111827;">You left items in your cart</h2>
    <p style="margin: 0 0 24px; font-size: 15px; color: #4b5563;">
      Hi ${name}, looks like you didn't finish checking out. Your items are still waiting for you.
    </p>

    <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
      <table width="100%" cellspacing="0" cellpadding="0">
        ${formattedItems.map(item => `
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; width: 56px;">
              ${item.image && !item.image.includes('placeholder') && !item.image.includes('No+Image') ? `
                <img src="${getEmailImageUrl(item.image)}" width="44" height="44" style="border-radius: 6px; object-fit: cover; display: block; border: 1px solid #e5e7eb;">
              ` : `
                <div style="width: 44px; height: 44px; border-radius: 6px; background-color: #f3f4f6; text-align: center; line-height: 44px; font-size: 20px;">🐟</div>
              `}
            </td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: middle;">
              <div style="font-size: 14px; font-weight: 600; color: #111827;">${item.name}</div>
              <div style="font-size: 13px; color: #6b7280;">Qty: ${item.qty}</div>
            </td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; text-align: right; vertical-align: middle; font-size: 14px; font-weight: 600; color: #111827;">₹${item.price.toLocaleString()}</td>
          </tr>
        `).join('')}
      </table>
      <div style="padding: 12px 16px; background-color: #f9fafb; text-align: right; font-size: 14px;">
        <span style="color: #6b7280;">Cart Total: </span>
        <strong style="color: #111827;">₹${cartTotal.toLocaleString()}</strong>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${API_URL}/cart" style="${btnStyle}">Complete Your Order</a>
    </div>

    <p style="margin: 20px 0 0; font-size: 13px; color: #9ca3af; text-align: center;">
      Fresh stock is limited and sells out daily. Order soon to avoid missing out.
    </p>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `You left items in your cart — SeaBite`,
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
    <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #111827;">We miss you, ${name}</h2>
    <p style="margin: 0 0 24px; font-size: 15px; color: #4b5563;">
      It's been a while since your last order. Here's a special discount to welcome you back.
    </p>

    <div style="border: 2px dashed #d1d5db; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px; background-color: #f9fafb;">
      <div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">Your coupon code</div>
      <div style="font-size: 28px; font-weight: 700; color: #111827; letter-spacing: 4px; font-family: 'Courier New', monospace;">${couponCode}</div>
      <div style="font-size: 14px; color: #059669; font-weight: 600; margin-top: 8px;">15% off &middot; Valid for 48 hours</div>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px; text-align: center;">
      Apply this code at checkout on your next order.
    </p>

    <div style="text-align: center;">
      <a href="https://seabite.co.in" style="${btnStyle}">Shop Now</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `Here's 15% off your next order, ${name} — SeaBite`,
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
    <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #111827;">You earned SeaBite Cash!</h2>
    <p style="margin: 0 0 24px; font-size: 15px; color: #4b5563;">
      Hi ${name}, ₹${amount} has been credited to your SeaBite Cash balance.
    </p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">Amount Credited</div>
      <div style="font-size: 28px; font-weight: 700; color: #059669;">+₹${amount}</div>
      <div style="font-size: 13px; color: #6b7280; margin-top: 8px;">Reason: ${reason}</div>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px;">
      This balance will be automatically applied as a discount on your next order.
    </p>

    <div style="text-align: center;">
      <a href="https://seabite.co.in/profile" style="${btnStyle}">View Balance</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `₹${amount} SeaBite Cash credited to your account`,
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
    <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #111827;">⚠️ Low Stock Alert</h2>
    <p style="margin: 0 0 24px; font-size: 15px; color: #4b5563;">
      <strong>${productName}</strong> is running low on inventory and needs restocking.
    </p>

    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 13px; color: #991b1b; margin-bottom: 4px;">Current Stock</div>
      <div style="font-size: 32px; font-weight: 700; color: #dc2626;">${stockCount} units</div>
    </div>

    <div style="text-align: center;">
      <a href="https://seabite.co.in/admin/products" style="${btnStyle}">Manage Inventory</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: adminEmail,
      subject: `Low stock: ${productName} (${stockCount} left) — SeaBite`,
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
    <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #111827;">Almost sold out</h2>
    <p style="margin: 0 0 24px; font-size: 15px; color: #4b5563;">
      Hi ${name}, <strong>${product.name}</strong> that you viewed is running low — only ${product.countInStock} left.
    </p>
    
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 16px; font-weight: 600; color: #dc2626;">Only ${product.countInStock} left in stock</div>
    </div>

    <div style="text-align: center;">
      <a href="https://seabite.co.in/products/${product._id}" style="${btnStyle}">Buy Now</a>
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
    <h2 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #111827;">${title}</h2>
    <p style="margin: 0 0 20px; font-size: 16px; color: #4b5563; font-weight: 500;">${subtitle}</p>
    
    ${image ? `<img src="${image}" alt="${title}" style="width: 100%; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">` : ''}
    
    <p style="margin: 0 0 28px; font-size: 15px; color: #4b5563; line-height: 1.7;">
      ${description}
    </p>

    <div style="text-align: center;">
      <a href="${ctaLink || 'https://seabite.co.in'}" style="${btnStyle}">${ctaText || 'Shop Now'}</a>
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
      // Avoid rate limits
      await new Promise(r => setTimeout(r, 100)); 
    } catch (err) {
      results.failed++;
    }
  }

  console.log(`✅ Batch complete. Success: ${results.success}, Failed: ${results.failed}`);
  return results;
};