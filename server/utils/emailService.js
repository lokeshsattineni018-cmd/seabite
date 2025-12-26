import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const OFFICIAL_SENDER = 'SeaBite Official <official@seabite.co.in>';
const ORDERS_SENDER = 'SeaBite Orders <orders@seabite.co.in>';

// 🟢 The Aesthetic Wrapper: Glassmorphism & Deep Slate Design
const aestheticWrapper = (content, subtitle) => `
  <div style="background: #020617; padding: 50px 20px; font-family: 'DM Sans', sans-serif, 'Helvetica Neue', Arial;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background: #0f172a; border-radius: 24px; border: 1px solid #1e293b; overflow: hidden;">
      <tr>
        <td style="padding: 40px 0; text-align: center;">
          <img src="https://seabite.co.in/logo.png" width="160" alt="SeaBite" style="margin-bottom: 10px;">
          <div style="color: #38bdf8; font-size: 11px; text-transform: uppercase; letter-spacing: 5px; font-weight: 700;">${subtitle}</div>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 40px 40px 40px; color: #cbd5e1; line-height: 1.8; font-size: 15px;">
          ${content}
        </td>
      </tr>
      <tr>
        <td style="padding: 30px; background: rgba(30, 41, 59, 0.5); text-align: center;">
          <div style="font-size: 12px; color: #64748b; letter-spacing: 1px;">
            &copy; 2025 SEABITE INDIA &bull; THE ART OF FRESHNESS
          </div>
        </td>
      </tr>
    </table>
  </div>
`;

/**
 * 🟢 1. AUTH: AESTHETIC SECURITY / WELCOME
 */
export const sendAuthEmail = async (email, name, isNewUser = false) => {
  const istTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", timeStyle: "short", dateStyle: "medium" });
  
  const content = `
    <h1 style="color: #f8fafc; font-size: 28px; font-weight: 300; margin-bottom: 20px;">
      ${isNewUser ? `Welcome to the <span style="color: #38bdf8;">Elite</span>` : `Welcome Back, <span style="color: #38bdf8;">${name}</span>`}
    </h1>
    <p style="margin-bottom: 25px;">
      ${isNewUser 
        ? "You've successfully gained access to the freshest seafood supply chain in India. Prepare your palate for something extraordinary." 
        : `A secure login was verified at <b>${istTime} IST</b>. We're keeping your account under the surface and safe.`}
    </p>
    <div style="text-align: center; margin-top: 35px;">
      <a href="https://seabite.co.in" style="background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 600; display: inline-block; box-shadow: 0 10px 15px -3px rgba(56, 189, 248, 0.3);">ENTER STORE</a>
    </div>
  `;

  return await resend.emails.send({
    from: OFFICIAL_SENDER,
    to: email,
    subject: isNewUser ? 'SeaBite | Access Granted' : 'SeaBite | Security Sync',
    html: aestheticWrapper(content, isNewUser ? "NEW MEMBER" : "SECURE ACCESS")
  });
};

/**
 * 🟢 2. ORDERS: MINIMALIST BLACK-CARD RECEIPT
 */
export const sendOrderPlacedEmail = async (email, name, orderId, total, items, paymentMethod) => {
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
    <h1 style="color: #f8fafc; font-size: 26px; font-weight: 300; margin-bottom: 10px;">Order <span style="color: #38bdf8;">Confirmed</span></h1>
    <p style="font-size: 14px; margin-bottom: 30px;">Ref: #${orderId} | Our team is hand-selecting your items now.</p>
    
    <table width="100%" style="border-collapse: collapse;">
      ${itemRows}
      <tr>
        <td style="padding-top: 30px; font-size: 14px; color: #94a3b8;">${isCOD ? "PAY ON DELIVERY" : "TOTAL SECURED"}</td>
        <td style="padding-top: 30px; text-align: right; font-size: 22px; color: #f8fafc; font-weight: 300;">₹${total.toLocaleString()}</td>
      </tr>
    </table>

    <div style="margin-top: 40px; padding: 20px; background: rgba(56, 189, 248, 0.1); border-radius: 15px; text-align: center; border: 1px solid rgba(56, 189, 248, 0.2);">
      <span style="color: #38bdf8; font-size: 13px; letter-spacing: 2px; font-weight: 600;">ESTIMATED ARRIVAL: 2-3 BUSINESS DAYS</span>
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
  const isDelivered = status === 'Delivered';
  const accent = isDelivered ? '#10b981' : '#38bdf8';

  const content = `
    <div style="text-align: center; margin-bottom: 40px;">
       <div style="display: inline-block; width: 80px; height: 80px; line-height: 80px; border-radius: 50%; background: rgba(56, 189, 248, 0.1); font-size: 30px; border: 1px solid ${accent};">
         ${isDelivered ? '✨' : '🌊'}
       </div>
       <h1 style="color: #f8fafc; font-size: 28px; font-weight: 300; margin-top: 20px;">Order is <span style="color: ${accent};">${status}</span></h1>
    </div>

    <div style="height: 2px; width: 100%; background: #1e293b; margin-bottom: 40px; position: relative;">
       <div style="height: 2px; width: ${isDelivered ? '100%' : '60%'}; background: ${accent}; box-shadow: 0 0 10px ${accent};"></div>
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