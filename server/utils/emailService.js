import { Resend } from 'resend';

// 🚨 SAFE INITIALIZATION: Prevents crash if RESEND_API_KEY is missing
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const OFFICIAL_SENDER = 'SeaBite Official <official@seabite.co.in>';
const ORDERS_SENDER = 'SeaBite Orders <orders@seabite.co.in>';

const LOGO_URL = process.env.LOGO_URL || "https://seabite.co.in/logo.png";

const BRAND_PRIMARY = "#1A2E2C"; // Primary Sea
const BRAND_ACCENT = "#F07468"; // Accent Fresh
const BRAND_TEXT = "#374151"; // Grayscale Text
const BRAND_BG = "#F9FAFB"; // Grayscale Background

const aestheticWrapper = (content, subtitle, isMarketing = false) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; border-radius: 0 !important; }
          .cta-button { width: 100% !important; box-sizing: border-box !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${BRAND_BG}; font-family: 'Inter', 'Segoe UI', Roboto, sans-serif;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);" class="container">
        <!-- Header -->
        <tr>
          <td style="padding: 40px 20px; text-align: center; background-color: ${BRAND_PRIMARY};">
            <img src="${LOGO_URL}" width="140" alt="SeaBite" style="display: block; margin: 0 auto 12px;">
            <div style="color: #ffffff; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; font-weight: 700; opacity: 0.8;">${subtitle}</div>
          </td>
        </tr>
        
        <!-- Content Area -->
        <tr>
          <td style="padding: 48px 40px; color: ${BRAND_TEXT}; line-height: 1.6; font-size: 16px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding: 40px; background-color: #f3f4f6; text-align: center; border-top: 1px solid #e5e7eb;">
            <div style="margin-bottom: 24px;">
              <a href="https://instagram.com/seabite" style="margin: 0 10px; text-decoration: none; color: ${BRAND_PRIMARY}; font-weight: 600; font-size: 13px;">Instagram</a>
              <a href="https://twitter.com/seabite" style="margin: 0 10px; text-decoration: none; color: ${BRAND_PRIMARY}; font-weight: 600; font-size: 13px;">Twitter</a>
              <a href="https://facebook.com/seabite" style="margin: 0 10px; text-decoration: none; color: ${BRAND_PRIMARY}; font-weight: 600; font-size: 13px;">Facebook</a>
            </div>
            <div style="font-size: 12px; color: #6b7280; line-height: 1.5;">
              SeaBite India &bull; The Art of Freshness<br>
              123 Coastal Road, Vizag, AP, India<br><br>
              &copy; 2026 SeaBite. All rights reserved.<br>
              <a href="https://seabite.co.in/unsubscribe" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
            </div>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;

/**
 * 🟢 1. AUTH: AESTHETIC SECURITY / WELCOME
 */
export const sendAuthEmail = async (email, name, isNewUser = false) => {
  if (!resend) return console.log("⚠️ Email skipped: Missing RESEND_API_KEY");

  const istTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", timeStyle: "short", dateStyle: "medium" });

  const content = `
    <h1 style="color: ${BRAND_PRIMARY}; font-size: 28px; font-weight: 700; margin-bottom: 16px;">
      ${isNewUser ? `Welcome to the Elite` : `Welcome Back, ${name}`}
    </h1>
    <p style="margin-bottom: 32px; font-size: 16px; color: ${BRAND_TEXT};">
      ${isNewUser
      ? "You've successfully gained access to the freshest seafood supply chain in India. Prepare your palate for something extraordinary."
      : `A secure login was verified at <b>${istTime} IST</b>. We're keeping your account safe and secure.`}
    </p>
    <div style="text-align: center;">
      <a href="https://seabite.co.in" class="cta-button" style="background-color: ${BRAND_ACCENT}; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; display: block; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(240, 116, 104, 0.2);">ENTER STORE</a>
    </div>
  `;

  return await resend.emails.send({
    from: OFFICIAL_SENDER,
    to: email,
    subject: isNewUser ? 'SeaBite | Access Granted' : 'SeaBite Secure Login',
    html: aestheticWrapper(content, isNewUser ? "NEW MEMBER" : "SECURE ACCESS")
  });
};

/**
 * 🟢 2. ORDERS: MINIMALIST BLACK-CARD RECEIPT
 */
export const sendOrderPlacedEmail = async (email, name, orderId, total, items, paymentMethod) => {
  if (!resend) return;

  const isCOD = paymentMethod === "COD";
  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 20px 0; border-bottom: 1px solid #1e293b;">
        <div style="color: #f8fafc; font-weight: 500;">${item.name}</div>
        <div style="font-size: 12px; color: #64748b;">QUANTITY: ${item.qty}</div>
      </td>
      <td style="padding: 20px 0; text-align: right; border-bottom: 1px solid #1e293b; color: #38bdf8; font-weight: 600;">₹${(item.price * item.qty).toLocaleString()}</td>
    </tr>
  `).join('');

  const content = `
    <h1 style="color: ${BRAND_PRIMARY}; font-size: 26px; font-weight: 700; margin-bottom: 8px;">Order Confirmed</h1>
    <p style="font-size: 15px; margin-bottom: 32px; color: ${BRAND_TEXT}; opacity: 0.8;">Ref: #${orderId} | Our team is hand-selecting your items now.</p>
    
    <table width="100%" style="border-collapse: collapse;">
      ${itemRows}
      <tr>
        <td style="padding-top: 32px; font-size: 14px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">${isCOD ? "PAY ON DELIVERY" : "TOTAL PAID"}</td>
        <td style="padding-top: 32px; text-align: right; font-size: 24px; color: ${BRAND_PRIMARY}; font-weight: 800;">₹${total.toLocaleString()}</td>
      </tr>
    </table>

    <div style="margin-top: 40px; padding: 24px; background-color: ${BRAND_BG}; border-radius: 12px; text-align: center; border: 1px solid #e5e7eb;">
      <span style="color: ${BRAND_PRIMARY}; font-size: 13px; letter-spacing: 1px; font-weight: 700;">ESTIMATED ARRIVAL: 2-3 BUSINESS DAYS</span>
    </div>
  `;

  return await resend.emails.send({
    from: ORDERS_SENDER,
    to: email,
    subject: `SeaBite Receipt | #${orderId}`,
    html: aestheticWrapper(content, "ORDER CONFIRMATION")
  });
};

/**
 * 🟢 3. STATUS: DYNAMIC GLASS-THEME PROGRESS
 */
export const sendStatusUpdateEmail = async (email, name, orderId, status) => {
  if (!resend) return;

  const isDelivered = status === 'Delivered';
  const accent = isDelivered ? '#10b981' : '#38bdf8';

  const content = `
    <div style="text-align: center; margin-bottom: 40px;">
       <h1 style="color: #f8fafc; font-size: 28px; font-weight: 300; margin-top: 20px;">Order is <span style="color: ${accent};">${status}</span></h1>
    </div>

    <p style="text-align: center; margin-bottom: 30px;">Order #${orderId} is moving through our premium logistics chain.</p>

    <div style="text-align: center;">
      <a href="https://seabite.co.in/profile" style="border: 1px solid ${accent}; color: ${accent}; padding: 14px 35px; text-decoration: none; border-radius: 50px; font-size: 13px; font-weight: 700; display: inline-block; letter-spacing: 2px;">LIVE TRACKING</a>
    </div>
  `;

  return await resend.emails.send({
    from: ORDERS_SENDER,
    to: email,
    subject: `SeaBite | Movement Update #${orderId}`,
    html: aestheticWrapper(content, "LOGISTICS SYNC")
  });
};

/**
 * 🟢 4. MARKETING: PREMIUM PROMOTIONAL BLAST (BATCH)
 * Sends up to 100 emails in a single API call.
 */
export const sendBatchMarketingEmails = async (recipients, subject, messageBody) => {
  if (!resend) return;

  const batch = recipients.map((user) => {
    const content = `
      <h1 style="color: #f8fafc; font-size: 24px; font-weight: 300; margin-bottom: 20px;">
        Hello <span style="color: #38bdf8;">${user.name || "Customer"}</span>,
      </h1>
      <div style="color: #cbd5e1; line-height: 1.8; font-size: 15px;">
        ${messageBody}
      </div>
      <div style="text-align: center; margin-top: 40px;">
        <a href="https://seabite.co.in" style="background: #38bdf8; color: #020617; padding: 14px 35px; text-decoration: none; border-radius: 50px; font-size: 13px; font-weight: 700; display: inline-block; letter-spacing: 2px;">SHOP DEALS</a>
      </div>
    `;

    return {
      from: OFFICIAL_SENDER,
      to: user.email,
      subject: subject,
      html: aestheticWrapper(content, "EXCLUSIVE UPDATE")
    };
  });

  return await resend.batch.send(batch);
};

/**
 * 🟢 4.1 MARKETING: SINGLE EMAIL (Legacy Support)
 */
export const sendMarketingEmail = async (email, name, subject, body) => {
  if (!resend) return;
  // reuse the batch logic for consistency if needed, but keeping separate for now
  const content = `
    <h1 style="color: #f8fafc; font-size: 24px; font-weight: 300; margin-bottom: 20px;">
      Hello <span style="color: #38bdf8;">${name}</span>,
    </h1>
    <div style="color: #cbd5e1; line-height: 1.8; font-size: 15px;">
      ${body}
    </div>
    <div style="text-align: center; margin-top: 40px;">
      <a href="https://seabite.co.in" style="background: #38bdf8; color: #020617; padding: 14px 35px; text-decoration: none; border-radius: 50px; font-size: 13px; font-weight: 700; display: inline-block; letter-spacing: 2px;">SHOP DEALS</a>
    </div>
  `;

  return await resend.emails.send({
    from: OFFICIAL_SENDER,
    to: email,
    subject: subject,
    html: aestheticWrapper(content, "EXCLUSIVE UPDATE")
  });
};

/**
 * 🟢 5. ENTERPRISE: BACK-IN-STOCK WAITLIST
 */
export const sendWaitlistEmail = async (email, name, productName, productImage) => {
  if (!resend) return;

  const content = `
    <div style="margin-bottom: 32px; border-radius: 12px; overflow: hidden; height: 200px;">
      <img src="https://images.unsplash.com/photo-1559742811-824289541bd7?auto=format&fit=crop&w=600&h=200" alt="Fresh Catch" style="width: 100%; height: 100%; object-fit: cover;">
    </div>
    <h1 style="color: ${BRAND_PRIMARY}; font-size: 26px; font-weight: 700; margin-bottom: 16px;">
      It's Back!
    </h1>
    <p style="margin-bottom: 24px; color: ${BRAND_TEXT};">
      Good news, <b>${name}</b>! The product you've been waiting for is officially back in our premium supply chain.
    </p>
    
    <div style="background-color: ${BRAND_BG}; border-radius: 16px; padding: 32px; margin-bottom: 32px; text-align: center; border: 1px solid #e5e7eb;">
      <img src="${productImage}" alt="${productName}" style="width: 140px; height: 140px; object-fit: contain; margin-bottom: 20px; border-radius: 12px; background: white; padding: 10px;">
      <div style="color: ${BRAND_PRIMARY}; font-weight: 800; font-size: 20px;">${productName}</div>
    </div>

    <p style="font-size: 15px; text-align: center; color: #6b7280; margin-bottom: 32px;">
      Stock is limited and moves fast. Secure yours before it's gone again.
    </p>

    <div style="text-align: center;">
      <a href="https://seabite.co.in/products" class="cta-button" style="background-color: ${BRAND_ACCENT}; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; display: block; font-size: 16px; letter-spacing: 0.5px;">BUY NOW</a>
    </div>
  `;

  return await resend.emails.send({
    from: OFFICIAL_SENDER,
    to: email,
    subject: `Restocked: ${productName} is back!`,
    html: aestheticWrapper(content, "BACK IN STOCK")
  });
};

/**
 * 🟢 6. SECURITY: OTP VERIFICATION
 */
export const sendOtpEmail = async (email, otp, type = "VERIFY") => {
  if (!resend) return;

  let actionText = "A security verification was requested for your SeaBite account.";
  let titleText = "Security <span style=\"color: #38bdf8;\">Verification</span>";
  let subtitle = "SECURE ACTION";
  
  if (type === "FORGOT") {
    actionText = "A password reset was requested for your SeaBite account.";
    titleText = "Reset <span style=\"color: #38bdf8;\">Password</span>";
    subtitle = "PASSWORD RESET";
  } else if (type === "SIGNUP") {
    actionText = "You are one step away from joining SeaBite. Please verify your email to create your account.";
    titleText = "Welcome to <span style=\"color: #38bdf8;\">SeaBite</span>";
    subtitle = "VERIFY EMAIL";
  } else if (type === "ADMIN") {
    actionText = "A sensitive admin action (Maintenance Mode Toggle) was requested for your store.";
    titleText = "Admin <span style=\"color: #38bdf8;\">Security</span>";
    subtitle = "ADMIN ACTION";
  }

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <img src="https://cdn-icons-png.flaticon.com/512/1161/1161388.png" width="48" alt="Security" style="opacity: 0.8;">
    </div>
    <h1 style="color: ${BRAND_PRIMARY}; font-size: 26px; font-weight: 700; margin-bottom: 16px;">
      ${titleText.replace(/<span style="color: #38bdf8;">|<\/span>/g, "")}
    </h1>
    <p style="margin-bottom: 32px; color: ${BRAND_TEXT}; font-size: 16px;">
      ${actionText} Please use the following One-Time Password to proceed.
    </p>
    
    <div style="background-color: ${BRAND_BG}; border-radius: 12px; padding: 32px; margin-bottom: 32px; text-align: center; border: 1px solid #e5e7eb; letter-spacing: 12px; font-size: 36px; font-weight: 800; color: ${BRAND_ACCENT};">
      ${otp}
    </div>

    <p style="font-size: 14px; text-align: center; color: #6b7280; margin-bottom: 8px;">
      This code is valid for 10 minutes.
    </p>
    <p style="font-size: 12px; text-align: center; color: #ef4444; font-weight: 600;">
      If you did not request this, please ignore this email.
    </p>
  `;

  return await resend.emails.send({
    from: OFFICIAL_SENDER,
    to: email,
    subject: `SeaBite Security Code: ${otp}`,
    html: aestheticWrapper(content, subtitle)
  });
};

/**
 * 🟢 7. GENERIC: SUPPORT REPLY / CUSTOM EMAIL
 */
export const sendEmail = async (to, subject, content) => {
  if (!resend) return;

  const html = aestheticWrapper(content, "SUPPORT MESSAGE");

  return await resend.emails.send({
    from: OFFICIAL_SENDER,
    to,
    subject,
    html
  });
};
/**
 * 🟢 8. AUTOMATION: ABANDONED CART RECOVERY
 */
export const sendAbandonedCartEmail = async (email, name, cartItems) => {
  if (!resend) return;

  const content = `
    <h1 style="color: ${BRAND_PRIMARY}; font-size: 26px; font-weight: 700; margin-bottom: 16px;">
      You Left Something Behind!
    </h1>
    <p style="margin-bottom: 24px; color: ${BRAND_TEXT};">
      Hello <b>${name}</b>, we noticed you left some premium catch in your cart. 
      Our fresh supply is limited and moves fast. Secure your order before it's gone!
    </p>

    <div style="background-color: ${BRAND_BG}; border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center; border: 1px solid #e5e7eb;">
      <div style="font-size: 11px; color: #6b7280; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">YOUR CART CONTAINS</div>
      <div style="color: ${BRAND_PRIMARY}; font-weight: 700; font-size: 18px;">${cartItems.length} items waiting for you.</div>
    </div>

    <div style="text-align: center;">
      <a href="https://seabite.co.in/cart" class="cta-button" style="background-color: ${BRAND_ACCENT}; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; display: block; font-size: 16px; letter-spacing: 0.5px;">RETURN TO CART</a>
    </div>
  `;

  return await resend.emails.send({
    from: OFFICIAL_SENDER,
    to: email,
    subject: `SeaBite | Don't miss out on your fresh catch, ${name}!`,
    html: aestheticWrapper(content, "RESERVED CATCH")
  });
};

/**
 * 🟢 9. AUTOMATION: WIN-BACK COUPON
 */
export const sendWinBackEmail = async (email, name, couponCode) => {
  if (!resend) return;

  const content = `
    <h1 style="color: ${BRAND_PRIMARY}; font-size: 26px; font-weight: 700; margin-bottom: 16px;">
      We Miss You!
    </h1>
    <p style="margin-bottom: 24px; color: ${BRAND_TEXT};">
      Hello <b>${name}</b>, it's been a while since we've seen you. 
      The ocean has brought in some incredible catches lately, and we'd love for you to taste them.
    </p>

    <div style="background-color: ${BRAND_BG}; border-radius: 12px; padding: 32px; margin-bottom: 32px; text-align: center; border: 1px solid #e5e7eb;">
      <div style="font-size: 11px; color: #6b7280; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">YOUR EXCLUSIVE GIFT</div>
      <div style="font-size: 32px; font-weight: 800; color: ${BRAND_ACCENT}; letter-spacing: 4px;">${couponCode}</div>
      <div style="font-size: 13px; color: ${BRAND_TEXT}; font-weight: 600; margin-top: 12px;">15% OFF &bull; Valid for 48 Hours</div>
    </div>

    <p style="font-size: 14px; text-align: center; color: #6b7280; margin-bottom: 32px;">
      This code is linked to your account and cannot be transferred.
    </p>

    <div style="text-align: center;">
      <a href="https://seabite.co.in" class="cta-button" style="background-color: ${BRAND_ACCENT}; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; display: block; font-size: 16px; letter-spacing: 0.5px;">CLAIM OFFER</a>
    </div>
  `;

  return await resend.emails.send({
    from: OFFICIAL_SENDER,
    to: email,
    subject: `We miss you, ${name} (Gift Inside)`,
    html: aestheticWrapper(content, "VIP RETURN PASS")
  });
};

/**
 * 🟢 10. LOYALTY: SEABITE CASH CREDIT
 */
export const sendLoyaltyCreditEmail = async (email, name, amount, reason) => {
  if (!resend) return;

  const content = `
    <h1 style="color: ${BRAND_PRIMARY}; font-size: 26px; font-weight: 700; margin-bottom: 16px;">
      You've Earned SeaBite Cash!
    </h1>
    <p style="margin-bottom: 24px; color: ${BRAND_TEXT};">
      Hello <b>${name}</b>, your loyalty has been rewarded. We've credited your account with <b>₹${amount}</b> in SeaBite Cash.
    </p>

    <div style="background-color: ${BRAND_BG}; border-radius: 12px; padding: 32px; margin-bottom: 32px; text-align: center; border: 1px solid #e5e7eb;">
      <div style="font-size: 11px; color: #6b7280; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">CREDIT DETAILS</div>
      <div style="font-size: 32px; font-weight: 800; color: #10b981; letter-spacing: 2px;">+ ₹${amount}</div>
      <div style="font-size: 13px; color: ${BRAND_TEXT}; font-weight: 600; margin-top: 12px;">REASON: ${reason}</div>
    </div>

    <p style="font-size: 14px; text-align: center; color: #6b7280; margin-bottom: 32px;">
      Use this balance on your next order for an instant discount. No minimum order required.
    </p>

    <div style="text-align: center;">
      <a href="https://seabite.co.in/profile" class="cta-button" style="background-color: ${BRAND_ACCENT}; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; display: block; font-size: 16px; letter-spacing: 0.5px;">VIEW BALANCE</a>
    </div>
  `;

  return await resend.emails.send({
    from: OFFICIAL_SENDER,
    to: email,
    subject: `SeaBite Cash Credited: +₹${amount}`,
    html: aestheticWrapper(content, "LOYALTY REWARD")
  });
};

/**
 * 🟢 11. ADMIN: LOW INVENTORY ALERT
 */
export const sendInventoryAlertEmail = async (adminEmail, productName, stockCount) => {
  if (!resend) return;

  const content = `
    <h1 style="color: ${BRAND_PRIMARY}; font-size: 26px; font-weight: 700; margin-bottom: 16px;">
      Inventory Alert
    </h1>
    <p style="margin-bottom: 24px; color: ${BRAND_TEXT};">
      Critical alert for product: <b>${productName}</b>. Stock levels have dropped below the safety threshold.
    </p>

    <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 32px; margin-bottom: 32px; text-align: center;">
      <div style="font-size: 11px; color: #be123c; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">CURRENT STOCK</div>
      <div style="font-size: 32px; font-weight: 800; color: #e11d48; letter-spacing: 2px;">${stockCount} UNITS</div>
    </div>

    <div style="text-align: center;">
      <a href="https://seabite.co.in/admin/products" class="cta-button" style="background-color: ${BRAND_ACCENT}; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; display: block; font-size: 16px; letter-spacing: 0.5px;">RESTOCK NOW</a>
    </div>
  `;

  return await resend.emails.send({
    from: OFFICIAL_SENDER,
    to: adminEmail,
    subject: `⚠️ INVENTORY ALERT: ${productName} (${stockCount} left)`,
    html: aestheticWrapper(content, "SYSTEM ALERT")
  });
};

/**
 * 🟢 12. DYNAMIC: LOW STOCK ALERT (Consumer Facing)
 */
export const sendLowStockAlert = async (email, name, product) => {
  if (!resend) return;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <img src="https://cdn-icons-png.flaticon.com/512/564/564619.png" width="48" alt="Urgent" style="opacity: 0.8;">
    </div>
    <h1 style="color: ${BRAND_PRIMARY}; font-size: 26px; font-weight: 700; margin-bottom: 16px; text-align: center;">
      Almost Gone!
    </h1>
    <p style="margin-bottom: 24px; color: ${BRAND_TEXT}; text-align: center;">
      Hi ${name}, the <b>${product.name}</b> you viewed is running extremely low on stock. 
    </p>
    
    <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center;">
      <div style="color: #e11d48; font-weight: 800; font-size: 18px; margin-bottom: 4px;">ONLY ${product.countInStock} LEFT IN STOCK</div>
      <div style="color: #9f1239; font-size: 13px; font-weight: 600;">Secure yours before it's completely sold out.</div>
    </div>

    <div style="text-align: center;">
      <a href="https://seabite.co.in/products/${product._id}" class="cta-button" style="background-color: ${BRAND_ACCENT}; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; display: block; font-size: 16px; letter-spacing: 0.5px;">CLAIM MINE NOW</a>
    </div>
  `;

  return await resend.emails.send({
    from: OFFICIAL_SENDER,
    to: email,
    subject: `Hurry! Only ${product.countInStock} left of ${product.name}`,
    html: aestheticWrapper(content, "URGENT UPDATE")
  });
};