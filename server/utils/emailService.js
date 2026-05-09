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

const LOGO_URL = process.env.LOGO_URL || "https://seabite.co.in/logo.png";

// Premium Design Tokens (Amazon/Flipkart inspired)
const T = {
  primary: "#1A2E2C",    // Deep Sea
  accent: "#5BBFB5",     // Caribbean Green
  coral: "#F07468",      // Fresh Coral
  text: "#2D3E3B",       // Slate Grey
  textLight: "#6B8F8A",  // Muted Teal
  bg: "#F4F9F8",         // Soft Sea Mist
  surface: "#FFFFFF",    // Clean White
  border: "#E2EEEC"      // Suble Divider
};

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
 * 🎨 Premium E-commerce Email Wrapper
 * Designed for maximum inbox delivery and elite visual appeal.
 */
const aestheticWrapper = (content, subtitle) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F4F9F8; margin: 0; padding: 20px; color: #1A2E2C; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { padding: 30px; text-align: center; background-color: #ffffff; border-bottom: 1px solid #E2EEEC; }
    .content { padding: 40px; line-height: 1.6; }
    .footer { padding: 30px; text-align: center; font-size: 12px; color: #6B8F8A; background-color: #F9FBFA; }
    .btn { display: inline-block; padding: 14px 30px; background-color: #F07468; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${LOGO_URL}" alt="SeaBite" width="140" style="margin-bottom: 10px;">
      <div style="font-size: 10px; color: #6B8F8A; text-transform: uppercase; letter-spacing: 2px;">${subtitle || 'PREMIUM COASTAL CATCH'}</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p><b>SeaBite HQ</b><br>Mogalthur, AP 534281, West Godavari, Andhra Pradesh</p>
      <p>&copy; 2026 SeaBite. All rights reserved.</p>
      <p>
        <a href="https://seabite.co.in/privacy" style="color: #5BBFB5; text-decoration: none;">Privacy</a> | 
        <a href="https://seabite.co.in/terms" style="color: #5BBFB5; text-decoration: none;">Terms</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

/**
 * 🟢 1. AUTH: AESTHETIC SECURITY / WELCOME
 */
export const sendAuthEmail = async (email, name, isNewUser = false) => {
  console.log(`🔍 [DEBUG] sendAuthEmail triggered for: ${email} (NewUser: ${isNewUser})`);
  if (!resend) return console.log("⚠️ Email skipped: Missing RESEND_API_KEY");

  const istTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", timeStyle: "short", dateStyle: "medium" });

  const content = `
    <h1 style="color: ${T.primary}; font-size: 28px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.02em;">
      ${isNewUser ? `Welcome to the Elite` : `Welcome Back, ${name}`}
    </h1>
    <p style="margin-bottom: 32px; font-size: 16px; color: ${T.text}; line-height: 1.6;">
      ${isNewUser
      ? "You've successfully gained access to the freshest seafood supply chain in India. Prepare your palate for something extraordinary."
      : `A secure login was verified at <b>${istTime} IST</b>. We're keeping your account safe and secure.`}
    </p>
    <div style="text-align: center; margin: 40px 0;">
      <a href="https://seabite.co.in" class="cta-button">ENTER STORE</a>
    </div>
    <p style="font-size: 13px; color: ${T.textLight}; text-align: center;">
      If this wasn't you, please <a href="mailto:support@seabite.co.in" style="color: ${T.accent}; font-weight: 600;">contact support</a> immediately.
    </p>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: isNewUser ? 'SeaBite | Access Granted' : 'SeaBite Secure Login',
      html: aestheticWrapper(content, isNewUser ? "NEW MEMBER" : "SECURE ACCESS")
    });
    logEmailSuccess(isNewUser ? "WELCOME" : "LOGIN", email);
    return result;
  } catch (err) {
    logEmailError("AUTH_EMAIL", err, { email, name });
  }
};

/**
 * 🟢 2. ORDERS: MINIMALIST BLACK-CARD RECEIPT
 */
export const sendOrderPlacedEmail = async (email, name, orderId, total, items, paymentMethod) => {
  console.log(`🔍 [DEBUG] sendOrderPlacedEmail triggered for: ${email} (Order: ${orderId})`);
  if (!resend) return;

  const isCOD = paymentMethod === "COD";
  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 24px 0; border-bottom: 1px solid ${T.border}; width: 80px; vertical-align: top;">
        <img src="${getEmailImageUrl(item.image)}" width="64" height="64" style="border-radius: 12px; object-fit: cover; display: block; background-color: ${T.bg};">
      </td>
      <td style="padding: 24px 16px; border-bottom: 1px solid ${T.border}; vertical-align: top;">
        <div style="color: ${T.primary}; font-weight: 800; font-size: 15px; margin-bottom: 4px;">${item.name}</div>
        <div style="font-size: 12px; color: ${T.textLight}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">QTY: ${item.qty} &bull; ₹${item.price}</div>
      </td>
      <td style="padding: 24px 0; text-align: right; border-bottom: 1px solid ${T.border}; color: ${T.primary}; font-weight: 800; font-size: 16px; vertical-align: top;">₹${(item.price * item.qty).toLocaleString()}</td>
    </tr>
  `).join('');

  const content = `
    <h1 style="color: ${T.primary}; font-size: 32px; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.03em;">Order Confirmed</h1>
    <p style="font-size: 16px; margin-bottom: 40px; color: ${T.text}; line-height: 1.6;">
      Hello <b>${name}</b>, your order <b>#${orderId}</b> has been received. Our team at Mogalthur is hand-selecting the freshest catch for you.
    </p>
    
    <table width="100%" style="border-collapse: collapse;">
      ${itemRows}
      <tr>
        <td colspan="2" style="padding-top: 32px; font-size: 13px; color: ${T.textLight}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">${isCOD ? "PAY ON DELIVERY" : "TOTAL PAID"}</td>
        <td style="padding-top: 32px; text-align: right; font-size: 28px; color: ${T.primary}; font-weight: 800; letter-spacing: -0.02em;">₹${total.toLocaleString()}</td>
      </tr>
    </table>

    <div style="margin-top: 48px; padding: 32px; background-color: ${T.bg}; border-radius: 20px; text-align: center; border: 1px solid ${T.border};">
      <div style="color: ${T.accent}; font-size: 12px; letter-spacing: 0.15em; font-weight: 800; margin-bottom: 8px; text-transform: uppercase;">Estimated Arrival</div>
      <div style="color: ${T.primary}; font-size: 18px; font-weight: 700;">2-3 Business Days</div>
    </div>
    
    <div style="text-align: center; margin-top: 40px;">
      <a href="https://seabite.co.in/profile" class="cta-button">TRACK MY ORDER</a>
    </div>
  `;

    try {
      const result = await resend.emails.send({
        from: ORDERS_SENDER,
        to: email,
        subject: `Order Confirmed: #${orderId} | SeaBite`,
        html: aestheticWrapper(content, "CONFIRMATION")
      });
      logEmailSuccess("ORDER_CONFIRMED", email);
      return result;
    } catch (err) {
      logEmailError("ORDER_EMAIL", err, { email, orderId });
    }
};

/**
 * 🟢 3. STATUS: DYNAMIC GLASS-THEME PROGRESS
 */
export const sendStatusUpdateEmail = async (email, name, orderId, status, items = []) => {
  console.log(`🔍 [DEBUG] sendStatusUpdateEmail triggered for: ${email} (Order: ${orderId}, Status: ${status})`);
  if (!resend) return;

  const isDelivered = status === 'Delivered';
  const statusColor = isDelivered ? '#10b981' : T.accent;

  const itemPreview = items.length > 0 ? `
    <div style="margin: 32px 0; padding: 24px; background: ${T.bg}; border: 1px solid ${T.border}; border-radius: 20px;">
      <div style="font-size: 11px; font-weight: 800; color: ${T.textLight}; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Shipment Contents</div>
      <table width="100%">
        ${items.map(item => `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid ${T.border};">
              <table width="100%">
                <tr>
                  <td width="48">
                    <img src="${getEmailImageUrl(item.image)}" width="40" height="40" style="border-radius: 10px; object-fit: cover; vertical-align: middle; background: white; border: 1px solid ${T.border};">
                  </td>
                  <td style="padding-left: 12px;">
                    <span style="font-size: 14px; font-weight: 700; color: ${T.primary};">${item.name}</span>
                  </td>
                  <td align="right" style="font-size: 13px; color: ${T.textLight}; font-weight: 600;">QTY: ${item.qty}</td>
                </tr>
              </table>
            </td>
          </tr>
        `).join('')}
      </table>
    </div>
  ` : '';

  const content = `
    <div style="text-align: center; margin-bottom: 40px;">
       <h1 style="color: ${T.primary}; font-size: 32px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.02em;">Order Update</h1>
       <div style="display: inline-block; padding: 8px 24px; background-color: ${statusColor}15; color: ${statusColor}; border-radius: 12px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">
         ${status}
       </div>
    </div>

    <p style="text-align: center; margin-bottom: 32px; color: ${T.text}; font-size: 16px; line-height: 1.6;">
      Hello ${name}, your order <b>#${orderId}</b> status has been updated. We're committed to getting your coastal catch to you as quickly as possible.
    </p>

    ${itemPreview}

    <div style="text-align: center; margin: 40px 0;">
      <a href="https://seabite.co.in/profile" class="cta-button">LIVE TRACKING</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: ORDERS_SENDER,
      to: email,
      subject: `Update on your SeaBite Order #${orderId}`,
      html: aestheticWrapper(content, "LOGISTICS SYNC")
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
    <h1 style="color: ${T.primary}; font-size: 28px; font-weight: 800; margin-bottom: 24px; letter-spacing: -0.02em;">
      Hello <span style="color: ${T.accent};">${name}</span>,
    </h1>
    <div style="color: ${T.text}; line-height: 1.8; font-size: 16px;">
      ${body}
    </div>
    <div style="text-align: center; margin: 40px 0;">
      <a href="https://seabite.co.in" class="cta-button">SHOP NOW</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: subject,
      html: aestheticWrapper(content, "EXCLUSIVE UPDATE")
    });
    logEmailSuccess("MARKETING", email);
    return result;
  } catch (err) {
    logEmailError("MARKETING_EMAIL", err, { email });
  }
};

/**
 * 🟢 5. ENTERPRISE: BACK-IN-STOCK WAITLIST
 */
export const sendWaitlistEmail = async (email, name, productName, productImage) => {
  console.log(`🔍 [DEBUG] sendWaitlistEmail triggered for: ${email} (Product: ${productName})`);
  if (!resend) return;

  const content = `
    <h1 style="color: ${T.primary}; font-size: 32px; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.03em;">It's Back!</h1>
    <p style="margin-bottom: 32px; color: ${T.text}; font-size: 16px; line-height: 1.6;">
      Good news, <b>${name}</b>! The product you've been waiting for is officially back in our premium supply chain.
    </p>
    
    <div style="background-color: ${T.surface}; border-radius: 20px; padding: 40px; margin-bottom: 32px; text-align: center; border: 1px solid ${T.border}; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
      <img src="${productImage}" alt="${productName}" style="width: 160px; height: 160px; object-fit: contain; margin-bottom: 24px; border-radius: 14px; background: ${T.bg}; padding: 12px;">
      <div style="color: ${T.primary}; font-weight: 800; font-size: 22px; letter-spacing: -0.01em;">${productName}</div>
    </div>

    <p style="font-size: 14px; text-align: center; color: ${T.textLight}; margin-bottom: 32px; font-weight: 500;">
      Stock is limited and moves fast. Secure yours before it's gone again.
    </p>

    <div style="text-align: center; margin: 40px 0;">
      <a href="https://seabite.co.in/products" class="cta-button">BUY NOW</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `Restocked: ${productName} is back! | SeaBite`,
      html: aestheticWrapper(content, "BACK IN STOCK")
    });
    logEmailSuccess("WAITLIST", email);
    return result;
  } catch (err) {
    logEmailError("WAITLIST_EMAIL", err, { email, productName });
  }
};

/**
 * 🟢 6. SECURITY: OTP VERIFICATION
 */
export const sendOtpEmail = async (email, otp, type = "VERIFY") => {
  console.log(`🔍 [DEBUG] sendOtpEmail triggered for: ${email} (Type: ${type}, OTP: ${otp})`);
  if (!resend) return;

  let actionText = "A security verification was requested for your SeaBite account.";
  let titleText = "Security Verification";
  let subtitle = "SECURE ACTION";
  
  if (type === "FORGOT") {
    actionText = "A password reset was requested for your SeaBite account.";
    titleText = "Reset Password";
    subtitle = "PASSWORD RESET";
  } else if (type === "SIGNUP") {
    actionText = "You are one step away from joining SeaBite. Please verify your email to create your account.";
    titleText = "Welcome to SeaBite";
    subtitle = "VERIFY EMAIL";
  } else if (type === "ADMIN") {
    actionText = "A sensitive admin action (Maintenance Mode Toggle) was requested for your store.";
    titleText = "Admin Security";
    subtitle = "ADMIN ACTION";
  }

  const content = `
    <h1 style="color: ${T.primary}; font-size: 28px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.02em;">
      ${titleText}
    </h1>
    <p style="margin-bottom: 40px; color: ${T.text}; font-size: 16px; line-height: 1.6;">
      ${actionText} Please use the following One-Time Password to proceed.
    </p>
    
    <div style="background-color: ${T.bg}; border-radius: 20px; padding: 48px 32px; margin-bottom: 40px; text-align: center; border: 1px solid ${T.border};">
      <div style="font-size: 11px; color: ${T.textLight}; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 16px;">Your Verification Code</div>
      <div style="letter-spacing: 12px; font-size: 48px; font-weight: 800; color: ${T.accent}; line-height: 1;">
        ${otp}
      </div>
    </div>

    <p style="font-size: 14px; text-align: center; color: ${T.textLight}; margin-bottom: 8px; font-weight: 500;">
      This code is valid for 10 minutes and should not be shared.
    </p>
    <p style="font-size: 12px; text-align: center; color: ${T.coral}; font-weight: 700;">
      If you did not request this, please ignore this email.
    </p>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `Your Security Code: ${otp} | SeaBite`,
      html: aestheticWrapper(content, subtitle)
    });
    logEmailSuccess(`OTP_${type}`, email);
    return result;
  } catch (err) {
    logEmailError("OTP_EMAIL", err, { email, type });
  }
};

/**
 * 🟢 7. GENERIC: SUPPORT REPLY / CUSTOM EMAIL
 */
export const sendEmail = async (to, subject, content) => {
  console.log(`🔍 [DEBUG] sendEmail (generic) triggered for: ${to}`);
  if (!resend) return;

  const html = aestheticWrapper(content, "SUPPORT MESSAGE");

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
 * 🟢 8. AUTOMATION: ABANDONED CART RECOVERY
 */
export const sendAbandonedCartEmail = async (email, name, cartItems) => {
  console.log(`🔍 [DEBUG] sendAbandonedCartEmail triggered for: ${email} (Items: ${cartItems.length})`);
  if (!resend) return;

  const content = `
    <h1 style="color: ${T.primary}; font-size: 32px; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.03em;">You Left Something Behind!</h1>
    <p style="margin-bottom: 32px; color: ${T.text}; font-size: 16px; line-height: 1.6;">
      Hello <b>${name}</b>, we noticed you left some premium catch in your cart. 
      Our fresh supply is limited and moves fast. Secure your order before it's gone!
    </p>

    <div style="background-color: ${T.bg}; border-radius: 20px; padding: 32px; margin-bottom: 40px; text-align: center; border: 1px solid ${T.border};">
      <div style="font-size: 11px; color: ${T.textLight}; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; font-weight: 800;">Items in your cart</div>
      <div style="color: ${T.primary}; font-weight: 800; font-size: 20px;">${cartItems.length} Products Reserved</div>
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 40px; border-collapse: separate; border-spacing: 0;">
      ${cartItems.map(item => `
        <tr>
          <td style="padding: 20px 0; border-bottom: 1px solid ${T.border};">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td width="72" style="vertical-align: top;">
                  <img src="${getEmailImageUrl(item.product?.image || item.image)}" width="64" height="64" style="border-radius: 12px; object-fit: cover; display: block; border: 1px solid ${T.border}; background: ${T.bg};">
                </td>
                <td style="padding-left: 20px; vertical-align: middle;">
                  <div style="font-size: 15px; font-weight: 800; color: ${T.primary}; margin-bottom: 4px;">${item.product?.name || item.name || 'Premium Item'}</div>
                  <div style="font-size: 12px; color: ${T.textLight}; font-weight: 600;">Quantity: ${item.qty || 1}</div>
                </td>
                <td align="right" style="vertical-align: middle;">
                  <div style="font-size: 16px; font-weight: 800; color: ${T.primary};">₹${item.product?.price || item.price || 0}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `).join('')}
    </table>

    <div style="text-align: center; margin: 40px 0;">
      <a href="https://seabite.co.in/cart" class="cta-button">COMPLETE MY ORDER</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `Don't miss out on your fresh catch, ${name}! | SeaBite`,
      html: aestheticWrapper(content, "RESERVED CATCH")
    });
    logEmailSuccess("ABANDONED_CART", email);
    return result;
  } catch (err) {
    logEmailError("ABANDONED_CART_EMAIL", err, { email });
  }
};

/**
 * 🟢 9. AUTOMATION: WIN-BACK COUPON
 */
export const sendWinBackEmail = async (email, name, couponCode) => {
  console.log(`🔍 [DEBUG] sendWinBackEmail triggered for: ${email}`);
  if (!resend) return;

  const content = `
    <h1 style="color: ${T.primary}; font-size: 32px; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.03em;">We Miss You!</h1>
    <p style="margin-bottom: 32px; color: ${T.text}; font-size: 16px; line-height: 1.6;">
      Hello <b>${name}</b>, it's been a while. The ocean has brought in some incredible catches lately, and we'd love for you to taste them.
    </p>

    <div style="background-color: ${T.bg}; border-radius: 20px; padding: 48px 32px; margin-bottom: 40px; text-align: center; border: 1px dashed ${T.accent};">
      <div style="font-size: 11px; color: ${T.textLight}; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 16px; font-weight: 800;">Your Exclusive Gift</div>
      <div style="font-size: 40px; font-weight: 800; color: ${T.primary}; letter-spacing: 6px; line-height: 1;">${couponCode}</div>
      <div style="font-size: 14px; color: ${T.accent}; font-weight: 700; margin-top: 16px;">15% OFF &bull; Next 48 Hours</div>
    </div>

    <p style="font-size: 14px; text-align: center; color: ${T.textLight}; margin-bottom: 32px; font-weight: 500;">
      Use this code at checkout to reclaim your premium seafood access.
    </p>

    <div style="text-align: center; margin: 40px 0;">
      <a href="https://seabite.co.in" class="cta-button">CLAIM MY GIFT</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `A special gift for you, ${name} | SeaBite`,
      html: aestheticWrapper(content, "VIP RETURN PASS")
    });
    logEmailSuccess("WIN_BACK", email);
    return result;
  } catch (err) {
    logEmailError("WIN_BACK_EMAIL", err, { email });
  }
};

/**
 * 🟢 10. LOYALTY: SEABITE CASH CREDIT
 */
export const sendLoyaltyCreditEmail = async (email, name, amount, reason) => {
  console.log(`🔍 [DEBUG] sendLoyaltyCreditEmail triggered for: ${email}`);
  if (!resend) return;

  const content = `
    <h1 style="color: ${T.primary}; font-size: 32px; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.03em;">Cash Credited!</h1>
    <p style="margin-bottom: 32px; color: ${T.text}; font-size: 16px; line-height: 1.6;">
      Hello <b>${name}</b>, your loyalty has been rewarded. We've credited your account with <b>₹${amount}</b> in SeaBite Cash.
    </p>

    <div style="background-color: ${T.bg}; border-radius: 20px; padding: 48px 32px; margin-bottom: 40px; text-align: center; border: 1px solid ${T.border};">
      <div style="font-size: 11px; color: ${T.textLight}; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; font-weight: 800;">Reward Balance</div>
      <div style="font-size: 40px; font-weight: 800; color: #10b981; letter-spacing: -0.02em;">+ ₹${amount}</div>
      <div style="font-size: 13px; color: ${T.textLight}; font-weight: 600; margin-top: 12px;">TYPE: ${reason}</div>
    </div>

    <p style="font-size: 14px; text-align: center; color: ${T.textLight}; margin-bottom: 32px; font-weight: 500;">
      Use this balance on your next order for an instant discount.
    </p>

    <div style="text-align: center; margin: 40px 0;">
      <a href="https://seabite.co.in/profile" class="cta-button">VIEW BALANCE</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `SeaBite Cash Credited: +₹${amount}`,
      html: aestheticWrapper(content, "LOYALTY REWARD")
    });
    logEmailSuccess("LOYALTY_CREDIT", email);
    return result;
  } catch (err) {
    logEmailError("LOYALTY_CREDIT_EMAIL", err, { email });
  }
};

/**
 * 🟢 11. ADMIN: LOW INVENTORY ALERT
 */
export const sendInventoryAlertEmail = async (adminEmail, productName, stockCount) => {
  console.log(`🔍 [DEBUG] sendInventoryAlertEmail triggered for admin: ${adminEmail} (Product: ${productName})`);
  if (!resend) return;

  const content = `
    <h1 style="color: ${T.primary}; font-size: 32px; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.03em;">Inventory Alert</h1>
    <p style="margin-bottom: 32px; color: ${T.text}; font-size: 16px; line-height: 1.6;">
      Critical alert for product: <b>${productName}</b>. Stock levels have dropped below the safety threshold.
    </p>

    <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 20px; padding: 48px 32px; margin-bottom: 40px; text-align: center;">
      <div style="font-size: 11px; color: #be123c; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 16px; font-weight: 800;">Current Stock Level</div>
      <div style="font-size: 48px; font-weight: 800; color: #e11d48; line-height: 1;">${stockCount} UNITS</div>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="https://seabite.co.in/admin/products" class="cta-button">RESTOCK NOW</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: adminEmail,
      subject: `⚠️ INVENTORY ALERT: ${productName} (${stockCount} left) | SeaBite`,
      html: aestheticWrapper(content, "SYSTEM ALERT")
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
    <h1 style="color: ${T.primary}; font-size: 32px; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.03em;">Almost Gone!</h1>
    <p style="margin-bottom: 32px; color: ${T.text}; font-size: 16px; line-height: 1.6;">
      Hi ${name}, the <b>${product.name}</b> you viewed is running extremely low on stock. 
    </p>
    
    <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 20px; padding: 32px; margin-bottom: 40px; text-align: center;">
      <div style="color: #e11d48; font-weight: 800; font-size: 20px; margin-bottom: 8px;">ONLY ${product.countInStock} LEFT</div>
      <div style="color: #9f1239; font-size: 14px; font-weight: 600;">Secure yours before it's completely sold out.</div>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="https://seabite.co.in/products/${product._id}" class="cta-button">CLAIM MINE NOW</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `Hurry! Only ${product.countInStock} left of ${product.name} | SeaBite`,
      html: aestheticWrapper(content, "URGENT UPDATE")
    });
    logEmailSuccess("LOW_STOCK_ALERT", email);
    return result;
  } catch (err) {
    logEmailError("LOW_STOCK_ALERT_EMAIL", err, { email, productId: product._id });
  }
};

/**
 * 🟢 12. MARKETING: PROMOTIONAL BLAST
 */
export const sendMarketingPromoEmail = async (email, name, promoData) => {
  const { title, subtitle, image, ctaText, ctaLink, description } = promoData;
  console.log(`🔍 [DEBUG] sendMarketingPromoEmail triggered for: ${email}`);
  if (!resend) return;

  const content = `
    <h1 style="color: ${T.primary}; font-size: 36px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.04em; line-height: 1.1;">${title}</h1>
    <p style="margin-bottom: 24px; color: ${T.text}; font-size: 18px; font-weight: 600;">${subtitle}</p>
    
    ${image ? `<img src="${image}" alt="Promo" style="width: 100%; border-radius: 20px; margin-bottom: 32px; border: 1px solid ${T.border};">` : ''}
    
    <p style="margin-bottom: 40px; color: ${T.textLight}; font-size: 16px; line-height: 1.7;">
      ${description}
    </p>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${ctaLink || 'https://seabite.co.in'}" class="cta-button">${ctaText || 'SHOP THE SALE'}</a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `${title} | SeaBite Fresh`,
      html: aestheticWrapper(content, "SPECIAL OFFER", true)
    });
    logEmailSuccess("MARKETING_PROMO", email);
    return result;
  } catch (err) {
    logEmailError("MARKETING_PROMO_EMAIL", err, { email });
  }
};

/**
 * 🟢 13. BATCH: SEND TO MULTIPLE USERS
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