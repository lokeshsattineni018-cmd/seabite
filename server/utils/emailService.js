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
 * Base email template wrapper matching the new SeaBite branded design system.
 */
const emailWrapper = (content, preheader = "Your catch is confirmed — fresh from the coast to your door.") => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SeaBite</title>
</head>
<body style="margin:0; padding:0; background-color:#F4F1EA; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;">

<!-- Preheader (hidden preview text) -->
<div style="display:none; max-height:0; overflow:hidden; opacity:0;">
  ${preheader}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F1EA; padding:40px 0;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:90vw; background-color:#FFFFFF; border-radius:20px; overflow:hidden; box-shadow:0 4px 24px rgba(15,76,79,0.06);">

        <!-- Top wave band -->
        <tr>
          <td style="background:linear-gradient(135deg, #0F4C4F 0%, #146B6E 100%); padding:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:32px 40px 24px 40px;" align="center">
                  <img src="${LOGO_URL}" width="150" alt="SeaBite" style="display:block; width:150px; height:auto; margin:0 auto; border:none; outline:none; text-decoration:none;">
                  <p style="margin:8px 0 0 0; font-size:11px; letter-spacing:1.5px; color:#9FD8CE; text-transform:uppercase; font-weight:600;">Fresh Coastal Catch</p>
                </td>
              </tr>
            </table>
            <!-- wave svg divider -->
            <svg viewBox="0 0 600 24" width="100%" height="24" preserveAspectRatio="none" style="display:block;">
              <path d="M0,12 C100,24 200,0 300,12 C400,24 500,0 600,12 L600,24 L0,24 Z" fill="#FFFFFF"></path>
            </svg>
          </td>
        </tr>

        <!-- Content Area -->
        ${content}

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px 36px 40px; background-color:#FAF8F3;" align="center">
            <p style="margin:0 0 4px 0; font-size:12px; color:#A3ACA9;">Caught fresh. Delivered cold. Every single time.</p>
            <p style="margin:0; font-size:11.5px; color:#C2CAC7;">SeaBite &middot; Bhimavaram &middot; <a href="${API_URL}/faq" style="color:#7A8785; text-decoration:underline;">Help &amp; FAQs</a></p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>
`;

// Stylized premium button design inline
const btnStyle = `display:block; padding:15px 0; font-size:14.5px; font-weight:700; color:#FFFFFF; text-decoration:none; letter-spacing:0.3px; text-align:center;`;
const btnWrapperStyle = `border-radius:12px; background:linear-gradient(135deg, #0F4C4F 0%, #146B6E 100%);`;

// 1. AUTH: Login / Welcome
export const sendAuthEmail = async (email, name, isNewUser = false) => {
  console.log(`🔍 [DEBUG] sendAuthEmail triggered for: ${email} (NewUser: ${isNewUser})`);
  if (!resend) return console.log("⚠️ Email skipped: Missing RESEND_API_KEY");

  const istTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", timeStyle: "short", dateStyle: "medium" });

  const content = isNewUser ? `
    <!-- Icon -->
    <tr>
      <td style="padding:32px 40px 0 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:52px; height:52px; border-radius:50%; background-color:#EAF3F1; text-align:center; vertical-align:middle;">
              <span style="font-size:24px; line-height:52px; color:#0F4C4F;">👋</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 40px 4px 40px;" align="center">
        <h1 style="margin:0; font-size:26px; font-weight:700; color:#12312E; letter-spacing:-0.3px;">Welcome to SeaBite</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 40px 28px 40px;" align="center">
        <p style="margin:0; font-size:14px; color:#7A8785;">Fresh catches delivered directly from Mogalthur Coast</p>
      </td>
    </tr>

    <!-- Divider -->
    <tr><td style="padding:0 40px;"><div style="height:1px; background-color:#EFEBE2;"></div></td></tr>

    <!-- Message -->
    <tr>
      <td style="padding:28px 40px 12px 40px;">
        <p style="margin:0; font-size:15px; line-height:24px; color:#3D4744;">
          Hi <strong style="color:#12312E;">${name}</strong>, your account is officially set up. We source clean, premium catches directly from Mogalthur Coast at 4 AM and complete last-mile delivery to your kitchen before noon.
        </p>
      </td>
    </tr>

    <!-- Details Box -->
    <tr>
      <td style="padding:12px 40px 24px 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F9F8; border-radius:12px; border:1px solid #E2EEEC;">
          <tr>
            <td style="padding:16px 20px;">
              <strong style="font-size:14px; color:#12312E; display:block; margin-bottom:4px;">Our Freshness Guarantee</strong>
              <span style="font-size:13px; color:#6B8F8A; line-height:1.5;">Our operations preserve cold-chain integrity from catch to door, meaning your seafood is never frozen or chemically preserved.</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:8px 40px 36px 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="${btnWrapperStyle}">
              <a href="${API_URL}" style="${btnStyle}">Explore Daily Catch &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : `
    <!-- Login Alert Icon -->
    <tr>
      <td style="padding:32px 40px 0 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:52px; height:52px; border-radius:50%; background-color:#FDF2F2; text-align:center; vertical-align:middle;">
              <span style="font-size:22px; line-height:52px; color:#E53E3E;">&#128274;</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 40px 4px 40px;" align="center">
        <h1 style="margin:0; font-size:26px; font-weight:700; color:#12312E; letter-spacing:-0.3px;">New sign-in detected</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 40px 28px 40px;" align="center">
        <p style="margin:0; font-size:14px; color:#7A8785;">Security sign-in verification alert</p>
      </td>
    </tr>

    <!-- Divider -->
    <tr><td style="padding:0 40px;"><div style="height:1px; background-color:#EFEBE2;"></div></td></tr>

    <!-- Message -->
    <tr>
      <td style="padding:28px 40px 12px 40px;">
        <p style="margin:0; font-size:15px; line-height:24px; color:#3D4744;">
          Hi <strong style="color:#12312E;">${name}</strong>, a new sign-in was completed for your SeaBite account.
        </p>
      </td>
    </tr>

    <!-- Login Details Table -->
    <tr>
      <td style="padding:12px 40px 24px 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:14px 0; border-bottom:1px solid #F1EDE4;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="56" style="vertical-align:top;">
                    <div style="width:48px; height:48px; border-radius:12px; background-color:#EAF3F1; text-align:center; line-height:48px; font-size:20px; color:#0F4C4F;">🕒</div>
                  </td>
                  <td style="vertical-align:top; padding-left:12px;">
                    <p style="margin:0; font-size:14.5px; font-weight:600; color:#12312E;">Sign-in Time</p>
                    <p style="margin:2px 0 0 0; font-size:12.5px; color:#8B9591;">${istTime} IST</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 0; border-bottom:1px solid #F1EDE4;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="56" style="vertical-align:top;">
                    <div style="width:48px; height:48px; border-radius:12px; background-color:#EAF3F1; text-align:center; line-height:48px; font-size:20px; color:#0F4C4F;">🔑</div>
                  </td>
                  <td style="vertical-align:top; padding-left:12px;">
                    <p style="margin:0; font-size:14.5px; font-weight:600; color:#12312E;">Verification Method</p>
                    <p style="margin:2px 0 0 0; font-size:12.5px; color:#8B9591;">One-Time Passcode (OTP)</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Warning -->
    <tr>
      <td style="padding:0 40px 28px 40px;">
        <p style="margin:0; font-size:13px; line-height:20px; color:#8B9591;">
          If you did not make this request, please contact our support desk immediately to secure your profile.
        </p>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:8px 40px 36px 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="${btnWrapperStyle}">
              <a href="${API_URL}" style="${btnStyle}">Go to Dashboard &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: isNewUser ? `Welcome to SeaBite, ${name}!` : 'Sign-in verification — SeaBite',
      html: emailWrapper(content, isNewUser ? "Welcome to SeaBite! Fresh Coastal Catches." : "New sign-in detected for your account.")
    });
    logEmailSuccess(isNewUser ? "WELCOME" : "LOGIN", email);
    return result;
  } catch (err) {
    logEmailError("AUTH_EMAIL", err, { email, name });
  }
};

// 2. ORDERS: Order Confirmation Receipt
export const sendOrderPlacedEmail = async (email, name, orderId, total, items, paymentMethod) => {
  console.log(`🔍 [DEBUG] sendOrderPlacedEmail triggered for: ${email} (Order: ${orderId})`);
  if (!resend) return;

  const isCOD = paymentMethod === "COD";
  
  let subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  let discount = 0;
  let shippingPrice = subtotal < 1000 ? 99 : 0;
  let taxPrice = Math.round((subtotal - discount) * 0.05);
  let taxRate = 5;

  try {
    const Order = (await import("../models/Order.js")).default;
    const orderData = await Order.findOne({ $or: [{ orderId: orderId.toString() }, { orderId: Number(orderId) || 0 }] }).lean();
    if (orderData) {
      subtotal = orderData.itemsPrice || subtotal;
      discount = orderData.discount || 0;
      shippingPrice = typeof orderData.shippingPrice === 'number' ? orderData.shippingPrice : shippingPrice;
      taxPrice = typeof orderData.taxPrice === 'number' ? orderData.taxPrice : taxPrice;
      if (orderData.taxPrice !== undefined && orderData.itemsPrice > 0) {
        taxRate = Math.round((orderData.taxPrice / (orderData.itemsPrice - orderData.discount)) * 100);
      }
    }
  } catch (err) {
    console.log("Could not load order details from DB for email:", err.message);
  }

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:14px 0; border-bottom:1px solid #F1EDE4;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="56" style="vertical-align:top;">
              <div style="width:48px; height:48px; border-radius:12px; background-color:#EAF3F1; overflow:hidden; border:1px solid #E2EEEC;">
                <img src="${getEmailImageUrl(item.image)}" width="48" height="48" style="object-fit:cover; display:block;">
              </div>
            </td>
            <td style="vertical-align:top; padding-left:12px;">
              <p style="margin:0; font-size:14.5px; font-weight:600; color:#12312E;">${item.name}</p>
              <p style="margin:2px 0 0 0; font-size:12.5px; color:#8B9591;">Qty ${item.qty} &middot; &#8377;${item.price.toLocaleString()}</p>
            </td>
            <td align="right" style="vertical-align:top; white-space:nowrap;">
              <p style="margin:0; font-size:14.5px; font-weight:600; color:#12312E;">&#8377;${(item.price * item.qty).toLocaleString()}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const content = `
    <!-- Confirmation headline -->
    <tr>
      <td style="padding:32px 40px 0 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:52px; height:52px; border-radius:50%; background-color:#E6F4E9; text-align:center; vertical-align:middle;">
              <span style="font-size:24px; line-height:52px; color:#2E7D32;">&#10003;</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 40px 4px 40px;" align="center">
        <h1 style="margin:0; font-size:26px; font-weight:700; color:#12312E; letter-spacing:-0.3px;">Your catch is confirmed</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 40px 28px 40px;" align="center">
        <p style="margin:0; font-size:14px; color:#7A8785;">Order <span style="color:#0F4C4F; font-weight:600;">#${orderId}</span> &nbsp;&middot;&nbsp; ${isCOD ? 'Cash on Delivery' : 'Paid Online'}</p>
      </td>
    </tr>

    <!-- Divider -->
    <tr><td style="padding:0 40px;"><div style="height:1px; background-color:#EFEBE2;"></div></td></tr>

    <!-- Greeting -->
    <tr>
      <td style="padding:28px 40px 8px 40px;">
        <p style="margin:0; font-size:15px; line-height:24px; color:#3D4744;">
          Hi <strong style="color:#12312E;">${name}</strong>, thanks for shopping with us. Your dispatch is being prepared at the local facility — we'll notify you the moment your catch leaves the coast.
        </p>
      </td>
    </tr>

    <!-- Items -->
    <tr>
      <td style="padding:28px 40px 0 40px;">
        <p style="margin:0 0 14px 0; font-size:11px; letter-spacing:1.5px; color:#9AA6A3; text-transform:uppercase; font-weight:700;">Your Order</p>
      </td>
    </tr>

    <tr>
      <td style="padding:0 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${itemRows}
        </table>
      </td>
    </tr>

    <!-- Totals -->
    <tr>
      <td style="padding:20px 40px 0 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:5px 0; font-size:13.5px; color:#7A8785;">Subtotal</td>
            <td align="right" style="padding:5px 0; font-size:13.5px; color:#3D4744;">&#8377;${subtotal.toLocaleString()}</td>
          </tr>
          ${discount > 0 ? `
          <tr>
            <td style="padding:5px 0; font-size:13.5px; color:#2E7D32; font-weight:600;">Discounts</td>
            <td align="right" style="padding:5px 0; font-size:13.5px; color:#2E7D32; font-weight:600;">-&#8377;${discount.toLocaleString()}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding:5px 0; font-size:13.5px; color:#7A8785;">Delivery Charge</td>
            <td align="right" style="padding:5px 0; font-size:13.5px; color:#2E8B67; font-weight:600;">${shippingPrice > 0 ? `&#8377;${shippingPrice}` : 'Free'}</td>
          </tr>
          <tr>
            <td style="padding:5px 0 16px 0; font-size:13.5px; color:#7A8785;">GST (${taxRate}%)</td>
            <td align="right" style="padding:5px 0 16px 0; font-size:13.5px; color:#3D4744;">&#8377;${taxPrice.toLocaleString()}</td>
          </tr>
        </table>
        <div style="height:1px; background-color:#EFEBE2;"></div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:16px 0;">
              <p style="margin:0; font-size:15px; font-weight:700; color:#12312E;">${isCOD ? 'Amount to Pay' : 'Total Paid'}</p>
            </td>
            <td align="right" style="padding:16px 0;">
              <p style="margin:0; font-size:22px; font-weight:800; color:#0F4C4F;">&#8377;${total.toLocaleString()}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:8px 40px 36px 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="${btnWrapperStyle}">
              <a href="${API_URL}/orders/${orderId}" style="${btnStyle}">Track Your Shipment &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  try {
    const result = await resend.emails.send({
      from: ORDERS_SENDER,
      to: email,
      subject: `Order confirmed — #${orderId} | SeaBite`,
      html: emailWrapper(content, `Your SeaBite order #${orderId} of ₹${total} is confirmed!`)
    });
    logEmailSuccess("ORDER_CONFIRMED", email);
    return result;
  } catch (err) {
    logEmailError("ORDER_EMAIL", err, { email, orderId });
  }
};

// 3. STATUS: Order Status Update
export const sendStatusUpdateEmail = async (email, name, orderId, status, items = [], driverInfo = null) => {
  console.log(`🔍 [DEBUG] sendStatusUpdateEmail triggered for: ${email} (Order: ${orderId}, Status: ${status})`);
  if (!resend) return;

  const isDelivered = status === 'Delivered';
  const statusColor = isDelivered ? '#1E7E34' : '#0F4C81';
  const statusBg = isDelivered ? '#EAF2EC' : '#E6F0FA';

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:12px 0; border-bottom:1px solid #F1EDE4;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="44" style="vertical-align:middle;">
              <div style="width:36px; height:36px; border-radius:8px; overflow:hidden; border:1px solid #E2EEEC;">
                <img src="${getEmailImageUrl(item.image)}" width="36" height="36" style="object-fit:cover; display:block;">
              </div>
            </td>
            <td style="vertical-align:middle; padding-left:12px;">
              <p style="margin:0; font-size:14px; font-weight:600; color:#12312E;">${item.name}</p>
            </td>
            <td align="right" style="vertical-align:middle; white-space:nowrap;">
              <p style="margin:0; font-size:13px; color:#8B9591;">Qty ${item.qty}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const driverSection = driverInfo ? `
    <tr>
      <td style="padding:12px 40px 16px 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF8F3; border-radius:12px; border:1px solid #EFEBE2; font-size:13.5px;">
          <tr>
            <td colspan="2" style="padding:12px 16px 6px; font-weight:700; color:#0F4C4F; text-transform:uppercase; font-size:11px; letter-spacing:1px;">Delivery Specialist</td>
          </tr>
          <tr>
            <td style="padding:6px 16px 12px; color:#7A8785;">Specialist Name</td>
            <td align="right" style="padding:6px 16px 12px; color:#12312E; font-weight:600;">${driverInfo.name}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px; color:#7A8785; border-top:1px solid #EFEBE2;">Phone Number</td>
            <td align="right" style="padding:12px 16px; color:#12312E; font-weight:600; border-top:1px solid #EFEBE2;">${driverInfo.phone}</td>
          </tr>
          ${driverInfo.vehicleNumber ? `
          <tr>
            <td style="padding:12px 16px; color:#7A8785; border-top:1px solid #EFEBE2;">Vehicle Details</td>
            <td align="right" style="padding:12px 16px; color:#12312E; font-weight:600; border-top:1px solid #EFEBE2;">${driverInfo.vehicleType || 'Courier'} &middot; ${driverInfo.vehicleNumber}</td>
          </tr>
          ` : ''}
        </table>
      </td>
    </tr>
  ` : '';

  const content = `
    <!-- Icon -->
    <tr>
      <td style="padding:32px 40px 0 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:52px; height:52px; border-radius:50%; background-color:#EAF3F1; text-align:center; vertical-align:middle;">
              <span style="font-size:24px; line-height:52px; color:#0F4C4F;">🚚</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 40px 4px 40px;" align="center">
        <h1 style="margin:0; font-size:26px; font-weight:700; color:#12312E; letter-spacing:-0.3px;">Order shipment update</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 40px 28px 40px;" align="center">
        <p style="margin:0; font-size:14px; color:#7A8785;">Order <span style="color:#0F4C4F; font-weight:600;">#${orderId}</span> &middot; Status: <span style="color:${statusColor}; font-weight:700; background-color:${statusBg}; padding:2px 8px; border-radius:4px; font-size:12px;">${status.toUpperCase()}</span></p>
      </td>
    </tr>

    <!-- Divider -->
    <tr><td style="padding:0 40px;"><div style="height:1px; background-color:#EFEBE2;"></div></td></tr>

    <!-- Greeting -->
    <tr>
      <td style="padding:28px 40px 8px 40px;">
        <p style="margin:0; font-size:15px; line-height:24px; color:#3D4744;">
          Hi <strong style="color:#12312E;">${name}</strong>, the tracking registry indicates that your shipment status has changed.
        </p>
      </td>
    </tr>

    <!-- Driver details -->
    ${driverSection}

    <!-- Manifest items -->
    ${items.length > 0 ? `
    <tr>
      <td style="padding:16px 40px 0 40px;">
        <p style="margin:0 0 10px 0; font-size:11px; letter-spacing:1.5px; color:#9AA6A3; text-transform:uppercase; font-weight:700;">Shipment Manifest</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${itemRows}
        </table>
      </td>
    </tr>
    ` : ''}

    <!-- CTA -->
    <tr>
      <td style="padding:28px 40px 36px 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="${btnWrapperStyle}">
              <a href="${API_URL}/orders/${orderId}" style="${btnStyle}">Track Order Delivery &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  try {
    const result = await resend.emails.send({
      from: ORDERS_SENDER,
      to: email,
      subject: `Your order #${orderId} is ${status.toLowerCase()} — SeaBite`,
      html: emailWrapper(content, `Your order #${orderId} is now ${status.toLowerCase()}.`)
    });
    logEmailSuccess(`STATUS_${status.toUpperCase()}`, email);
    return result;
  } catch (err) {
    logEmailError("STATUS_UPDATE_EMAIL", err, { email, orderId, status });
  }
};

// 4. MARKETING: General Custom / Support / Marketing Email
export const sendMarketingEmail = async (email, name, subject, body) => {
  console.log(`🔍 [DEBUG] sendMarketingEmail triggered for: ${email}`);
  if (!resend) return;
  
  const content = `
    <!-- Icon -->
    <tr>
      <td style="padding:32px 40px 0 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:52px; height:52px; border-radius:50%; background-color:#EAF3F1; text-align:center; vertical-align:middle;">
              <span style="font-size:24px; line-height:52px; color:#0F4C4F;">📢</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 40px 4px 40px;" align="center">
        <h1 style="margin:0; font-size:24px; font-weight:700; color:#12312E; letter-spacing:-0.3px;">Hello ${name},</h1>
      </td>
    </tr>

    <!-- Divider -->
    <tr><td style="padding:0 40px;"><div style="height:1px; background-color:#EFEBE2;"></div></td></tr>

    <!-- Body text -->
    <tr>
      <td style="padding:28px 40px 24px 40px;">
        <div style="font-size:15px; line-height:24px; color:#3D4744;">
          ${body}
        </div>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:8px 40px 36px 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="${btnWrapperStyle}">
              <a href="${API_URL}" style="${btnStyle}">Shop Fresh Catches &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: subject,
      html: emailWrapper(content, subject)
    });
    logEmailSuccess("MARKETING", email);
    return result;
  } catch (err) {
    logEmailError("MARKETING_EMAIL", err, { email });
  }
};

// 5. STATUS: Back-in-Stock waitlist alert
export const sendWaitlistEmail = async (email, name, productName, productImage) => {
  console.log(`🔍 [DEBUG] sendWaitlistEmail triggered for: ${email} (Product: ${productName})`);
  if (!resend) return;

  const content = `
    <!-- Icon -->
    <tr>
      <td style="padding:32px 40px 0 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:52px; height:52px; border-radius:50%; background-color:#E8F5E9; text-align:center; vertical-align:middle;">
              <span style="font-size:24px; line-height:52px; color:#2E7D32;">✨</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 40px 4px 40px;" align="center">
        <h1 style="margin:0; font-size:26px; font-weight:700; color:#12312E; letter-spacing:-0.3px;">Back in Stock</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 40px 28px 40px;" align="center">
        <p style="margin:0; font-size:14px; color:#7A8785;">The catch you were waiting for has arrived</p>
      </td>
    </tr>

    <!-- Divider -->
    <tr><td style="padding:0 40px;"><div style="height:1px; background-color:#EFEBE2;"></div></td></tr>

    <!-- Product box -->
    <tr>
      <td style="padding:28px 40px 16px 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F9F8; border-radius:14px; border:1px solid #E2EEEC; padding:16px 20px;">
          <tr>
            <td width="80" style="vertical-align:middle;">
              <div style="width:72px; height:72px; border-radius:8px; overflow:hidden; border:1px solid #E2EEEC; background-color:#ffffff;">
                <img src="${productImage}" alt="${productName}" style="width:72px; height:72px; object-fit:contain; display:block;">
              </div>
            </td>
            <td style="vertical-align:middle; padding-left:16px;">
              <h3 style="margin:0 0 4px 0; font-size:16px; font-weight:700; color:#12312E;">${productName}</h3>
              <span style="display:inline-block; padding:3px 8px; background-color:#E8F5E9; color:#2E7D32; font-size:11px; font-weight:700; border-radius:4px; text-transform:uppercase; letter-spacing:0.5px;">Ready to Dispatch</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:0 40px 24px 40px;">
        <p style="margin:0; font-size:13.5px; line-height:22px; color:#8B9591;">
          Stock allocations are highly limited. Complete your order online immediately to secure this coastal catch.
        </p>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:8px 40px 36px 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="${btnWrapperStyle}">
              <a href="${API_URL}/products" style="${btnStyle}">Buy Now &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `${productName} is back in stock — SeaBite`,
      html: emailWrapper(content, `${productName} is back in stock at SeaBite!`)
    });
    logEmailSuccess("WAITLIST", email);
    return result;
  } catch (err) {
    logEmailError("WAITLIST_EMAIL", err, { email, productName });
  }
};

// 6. OTP: OTP Passcode Emails (Signup, Login, Password Reset, Admin)
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
    <!-- Header / Icon -->
    <tr>
      <td style="padding:32px 40px 0 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:52px; height:52px; border-radius:50%; background-color:#EAF3F1; text-align:center; vertical-align:middle;">
              <span style="font-size:24px; line-height:52px; color:#0F4C4F;">&#128274;</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 40px 4px 40px;" align="center">
        <h1 style="margin:0; font-size:26px; font-weight:700; color:#12312E; letter-spacing:-0.3px;">${heading}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 40px 28px 40px;" align="center">
        <p style="margin:0; font-size:14px; color:#7A8785;">${description}</p>
      </td>
    </tr>

    <!-- Divider -->
    <tr><td style="padding:0 40px;"><div style="height:1px; background-color:#EFEBE2;"></div></td></tr>

    <!-- OTP Code -->
    <tr>
      <td style="padding:32px 40px 16px 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#F4F9F8; border: 1.5px dashed #B8CFCC; border-radius:16px;">
          <tr>
            <td style="padding:24px 48px; text-align:center;">
              <p style="margin:0 0 6px 0; font-size:11px; letter-spacing:2px; color:#6B8F8A; text-transform:uppercase; font-weight:700;">Security Passcode</p>
              <p style="margin:0; font-size:36px; font-weight:800; color:#0F4C4F; letter-spacing:8px; font-family:SFMono-Regular, Consolas, Monaco, monospace; padding-left:8px;">${otp}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Warning / Expiry -->
    <tr>
      <td style="padding:12px 40px 36px 40px;" align="center">
        <p style="margin:0 0 6px 0; font-size:13.5px; color:#3D4744; font-weight:500;">
          This passcode is valid for 10 minutes. Do not share it with anyone.
        </p>
        <p style="margin:0; font-size:12px; color:#9AA6A3;">
          If you did not make this request, you can safely ignore this email.
        </p>
      </td>
    </tr>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: subjectLine,
      html: emailWrapper(content, `Verification passcode: ${otp}`)
    });
    logEmailSuccess(`OTP_${type}`, email);
    return result;
  } catch (err) {
    logEmailError("OTP_EMAIL", err, { email, type });
  }
};

// 7. SUPPORT: Custom Generic Support Sender
export const sendEmail = async (to, subject, contentText) => {
  console.log(`🔍 [DEBUG] sendEmail (generic) triggered for: ${to}`);
  if (!resend) return;

  const content = `
    <!-- Icon -->
    <tr>
      <td style="padding:32px 40px 0 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:52px; height:52px; border-radius:50%; background-color:#EAF3F1; text-align:center; vertical-align:middle;">
              <span style="font-size:24px; line-height:52px; color:#0F4C4F;">💬</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 40px 4px 40px;" align="center">
        <h1 style="margin:0; font-size:24px; font-weight:700; color:#12312E; letter-spacing:-0.3px;">Support Message</h1>
      </td>
    </tr>

    <!-- Divider -->
    <tr><td style="padding:0 40px;"><div style="height:1px; background-color:#EFEBE2;"></div></td></tr>

    <!-- Body -->
    <tr>
      <td style="padding:28px 40px 36px 40px;">
        <div style="font-size:15px; line-height:24px; color:#3D4744;">
          ${contentText}
        </div>
      </td>
    </tr>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to,
      subject,
      html: emailWrapper(content, subject)
    });
    logEmailSuccess("SUPPORT", to);
    return result;
  } catch (err) {
    logEmailError("GENERIC_EMAIL", err, { to });
  }
};

// 8. MARKETING: Abandoned Cart Recovery
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

  const itemRows = formattedItems.map(item => `
    <tr>
      <td style="padding:12px 0; border-bottom:1px solid #F1EDE4;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="44" style="vertical-align:middle;">
              <div style="width:36px; height:36px; border-radius:8px; overflow:hidden; border:1px solid #E2EEEC;">
                <img src="${getEmailImageUrl(item.image)}" width="36" height="36" style="object-fit:cover; display:block;">
              </div>
            </td>
            <td style="vertical-align:middle; padding-left:12px;">
              <p style="margin:0; font-size:14px; font-weight:600; color:#12312E;">${item.name}</p>
              <p style="margin:2px 0 0 0; font-size:12px; color:#8B9591;">Qty ${item.qty}</p>
            </td>
            <td align="right" style="vertical-align:middle; white-space:nowrap;">
              <p style="margin:0; font-size:14px; font-weight:600; color:#12312E;">&#8377;${item.price.toLocaleString()}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const content = `
    <!-- Icon -->
    <tr>
      <td style="padding:32px 40px 0 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:52px; height:52px; border-radius:50%; background-color:#FAF8F3; text-align:center; vertical-align:middle;">
              <span style="font-size:24px; line-height:52px; color:#7A8785;">🛒</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 40px 4px 40px;" align="center">
        <h1 style="margin:0; font-size:26px; font-weight:700; color:#12312E; letter-spacing:-0.3px;">Forgot something?</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 40px 28px 40px;" align="center">
        <p style="margin:0; font-size:14px; color:#7A8785;">We saved the items left in your shopping cart</p>
      </td>
    </tr>

    <!-- Divider -->
    <tr><td style="padding:0 40px;"><div style="height:1px; background-color:#EFEBE2;"></div></td></tr>

    <!-- Message -->
    <tr>
      <td style="padding:28px 40px 12px 40px;">
        <p style="margin:0; font-size:15px; line-height:24px; color:#3D4744;">
          Hi <strong style="color:#12312E;">${name}</strong>, we've saved your selections. Catches are sourced fresh daily and stock sells out fast. Secure your order before availability changes.
        </p>
      </td>
    </tr>

    <!-- Cart manifest list -->
    <tr>
      <td style="padding:0 40px 12px 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${itemRows}
          <tr>
            <td style="padding:16px 0; font-size:14px; font-weight:700; color:#12312E;">Cart Total</td>
            <td></td>
            <td align="right" style="padding:16px 0; font-size:16px; font-weight:800; color:#0F4C4F;">&#8377;${cartTotal.toLocaleString()}</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:8px 40px 36px 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="${btnWrapperStyle}">
              <a href="${API_URL}/cart" style="${btnStyle}">Resume Checkout &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `Complete your SeaBite order`,
      html: emailWrapper(content, "We saved the items in your SeaBite shopping cart.")
    });
    logEmailSuccess("ABANDONED_CART", email);
    return result;
  } catch (err) {
    logEmailError("ABANDONED_CART_EMAIL", err, { email });
  }
};

// 9. MARKETING: Win-Back Coupon Offers
export const sendWinBackEmail = async (email, name, couponCode) => {
  console.log(`🔍 [DEBUG] sendWinBackEmail triggered for: ${email}`);
  if (!resend) return;

  const content = `
    <!-- Icon -->
    <tr>
      <td style="padding:32px 40px 0 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:52px; height:52px; border-radius:50%; background-color:#EAF3F1; text-align:center; vertical-align:middle;">
              <span style="font-size:24px; line-height:52px; color:#0F4C4F;">🎁</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 40px 4px 40px;" align="center">
        <h1 style="margin:0; font-size:26px; font-weight:700; color:#12312E; letter-spacing:-0.3px;">Welcome back to SeaBite</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 40px 28px 40px;" align="center">
        <p style="margin:0; font-size:14px; color:#7A8785;">We've missed you! Here is a welcome back credit</p>
      </td>
    </tr>

    <!-- Divider -->
    <tr><td style="padding:0 40px;"><div style="height:1px; background-color:#EFEBE2;"></div></td></tr>

    <!-- Message -->
    <tr>
      <td style="padding:28px 40px 12px 40px;">
        <p style="margin:0; font-size:15px; line-height:24px; color:#3D4744;">
          Hi <strong style="color:#12312E;">${name}</strong>, it's been a while since your last fresh catch delivery. To welcome you back, we've active a special promo credit.
        </p>
      </td>
    </tr>

    <!-- Promo Box -->
    <tr>
      <td style="padding:12px 40px 24px 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#F4F9F8; border: 1.5px dashed #B8CFCC; border-radius:16px;">
          <tr>
            <td style="padding:24px 48px; text-align:center;">
              <p style="margin:0 0 6px 0; font-size:11px; letter-spacing:2px; color:#6B8F8A; text-transform:uppercase; font-weight:700;">Your Promo Code</p>
              <p style="margin:0; font-size:28px; font-weight:800; color:#0F4C4F; letter-spacing:4px; font-family:SFMono-Regular, Consolas, Monaco, monospace; text-transform:uppercase;">${couponCode}</p>
              <p style="margin:8px 0 0 0; font-size:13px; color:#2E7D32; font-weight:700;">15% OFF entire cart &middot; Expires in 48 hours</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:8px 40px 36px 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="${btnWrapperStyle}">
              <a href="${API_URL}" style="${btnStyle}">Redeem Welcome Offer &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `Get 15% off your next catch, ${name} | SeaBite`,
      html: emailWrapper(content, `Redeem promo code ${couponCode} for 15% off at SeaBite!`)
    });
    logEmailSuccess("WIN_BACK", email);
    return result;
  } catch (err) {
    logEmailError("WIN_BACK_EMAIL", err, { email });
  }
};

// 10. REFUNDS: Loyalty Cash Balance Wallet Credit Notice
export const sendLoyaltyCreditEmail = async (email, name, amount, reason) => {
  console.log(`🔍 [DEBUG] sendLoyaltyCreditEmail triggered for: ${email}`);
  if (!resend) return;

  const content = `
    <!-- Icon -->
    <tr>
      <td style="padding:32px 40px 0 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:52px; height:52px; border-radius:50%; background-color:#E8F5E9; text-align:center; vertical-align:middle;">
              <span style="font-size:24px; line-height:52px; color:#2E7D32; font-weight:700;">&#8377;</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 40px 4px 40px;" align="center">
        <h1 style="margin:0; font-size:26px; font-weight:700; color:#12312E; letter-spacing:-0.3px;">SeaBite Wallet Credited</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 40px 28px 40px;" align="center">
        <p style="margin:0; font-size:14px; color:#7A8785;">Balance adjustment confirmation receipt</p>
      </td>
    </tr>

    <!-- Divider -->
    <tr><td style="padding:0 40px;"><div style="height:1px; background-color:#EFEBE2;"></div></td></tr>

    <!-- Greeting -->
    <tr>
      <td style="padding:28px 40px 8px 40px;">
        <p style="margin:0; font-size:15px; line-height:24px; color:#3D4744;">
          Hi <strong style="color:#12312E;">${name}</strong>, ₹${amount} was credited to your SeaBite Cash Balance.
        </p>
      </td>
    </tr>

    <!-- Credit Box -->
    <tr>
      <td style="padding:12px 40px 24px 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F9F8; border-radius:12px; border:1px solid #E2EEEC; text-align:center;">
          <tr>
            <td style="padding:24px;">
              <div style="font-size:11px; color:#6B8F8A; margin-bottom:6px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em;">Balance added</div>
              <div style="font-size:32px; font-weight:800; color:#2E7D32;">+₹${amount.toLocaleString()}</div>
              <div style="font-size:13px; color:#8B9591; margin-top:8px;">Reason: ${reason}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Info -->
    <tr>
      <td style="padding:0 40px 28px 40px;">
        <p style="margin:0; font-size:13px; line-height:20px; color:#8B9591;">
          Your wallet balance will be automatically available as a payment source during checkout.
        </p>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:8px 40px 36px 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="${btnWrapperStyle}">
              <a href="${API_URL}/profile" style="${btnStyle}">Check Wallet Balance &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `₹${amount} SeaBite Cash credited to your wallet`,
      html: emailWrapper(content, `₹${amount} SeaBite Cash has been credited to your wallet.`)
    });
    logEmailSuccess("LOYALTY_CREDIT", email);
    return result;
  } catch (err) {
    logEmailError("LOYALTY_CREDIT_EMAIL", err, { email });
  }
};

// 11. ADMIN: Low Inventory Alert Notice
export const sendInventoryAlertEmail = async (adminEmail, productName, stockCount) => {
  console.log(`🔍 [DEBUG] sendInventoryAlertEmail triggered for admin: ${adminEmail} (Product: ${productName})`);
  if (!resend) return;

  const content = `
    <!-- Icon -->
    <tr>
      <td style="padding:32px 40px 0 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:52px; height:52px; border-radius:50%; background-color:#FFF5F5; text-align:center; vertical-align:middle;">
              <span style="font-size:24px; line-height:52px; color:#E53E3E;">⚠️</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 40px 4px 40px;" align="center">
        <h1 style="margin:0; font-size:24px; font-weight:700; color:#C53030; letter-spacing:-0.3px;">System: Low Stock Alert</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 40px 28px 40px;" align="center">
        <p style="margin:0; font-size:14px; color:#7A8785;">Product inventory has dropped below safety threshold</p>
      </td>
    </tr>

    <!-- Divider -->
    <tr><td style="padding:0 40px;"><div style="height:1px; background-color:#EFEBE2;"></div></td></tr>

    <!-- Alert Box -->
    <tr>
      <td style="padding:28px 40px 24px 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF5F5; border: 1px solid #FED7D7; border-radius:12px; padding:24px; text-align:center;">
          <tr>
            <td>
              <div style="font-size:11px; color:#C53030; margin-bottom:6px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em;">Product Item</div>
              <div style="font-size:16px; font-weight:700; color:#12312E; margin-bottom:12px;">${productName}</div>
              <div style="font-size:11px; color:#C53030; margin-bottom:6px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em;">Current Stock</div>
              <div style="font-size:32px; font-weight:800; color:#C53030;">${stockCount} Units</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:8px 40px 36px 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="border-radius:12px; background:linear-gradient(135deg, #C53030 0%, #9B2C2C 100%);">
              <a href="${API_URL}/admin/products" style="${btnStyle}">Manage Inventory Catalog &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: adminEmail,
      subject: `Low stock alert: ${productName} (${stockCount} left) — SeaBite`,
      html: emailWrapper(content, `Admin Alert: ${productName} has dropped to ${stockCount} units.`)
    });
    logEmailSuccess("INVENTORY_ALERT", adminEmail);
    return result;
  } catch (err) {
    logEmailError("INVENTORY_ALERT_EMAIL", err, { adminEmail, productName });
  }
};

// 12. CUSTOMERS: Low Stock Alert Notice
export const sendLowStockAlert = async (email, name, product) => {
  console.log(`🔍 [DEBUG] sendLowStockAlert triggered for: ${email} (Product: ${product.name})`);
  if (!resend) return;

  const content = `
    <!-- Icon -->
    <tr>
      <td style="padding:32px 40px 0 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:52px; height:52px; border-radius:50%; background-color:#FFF5F5; text-align:center; vertical-align:middle;">
              <span style="font-size:24px; line-height:52px; color:#C53030;">🔥</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 40px 4px 40px;" align="center">
        <h1 style="margin:0; font-size:26px; font-weight:700; color:#12312E; letter-spacing:-0.3px;">Selling out fast</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 40px 28px 40px;" align="center">
        <p style="margin:0; font-size:14px; color:#7A8785;">An item you viewed is almost gone</p>
      </td>
    </tr>

    <!-- Divider -->
    <tr><td style="padding:0 40px;"><div style="height:1px; background-color:#EFEBE2;"></div></td></tr>

    <!-- Message -->
    <tr>
      <td style="padding:28px 40px 12px 40px;">
        <p style="margin:0; font-size:15px; line-height:24px; color:#3D4744;">
          Hi <strong style="color:#12312E;">${name}</strong>, the catch item <strong>${product.name}</strong> is running extremely low on stock. Reserve yours online now to secure delivery.
        </p>
      </td>
    </tr>

    <!-- Alert Box -->
    <tr>
      <td style="padding:12px 40px 24px 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF5F5; border-radius:12px; border:1px solid #FED7D7; text-align:center; padding:16px 20px;">
          <tr>
            <td style="font-size:16px; font-weight:700; color:#C53030;">Remaining Stock: ${product.countInStock} Units left</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:8px 40px 36px 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="${btnWrapperStyle}">
              <a href="${API_URL}/products/${product._id}" style="${btnStyle}">Reserve Your Catch &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `Only ${product.countInStock} left — ${product.name} | SeaBite`,
      html: emailWrapper(content, `Only ${product.countInStock} units left for ${product.name}.`)
    });
    logEmailSuccess("LOW_STOCK_ALERT", email);
    return result;
  } catch (err) {
    logEmailError("LOW_STOCK_ALERT_EMAIL", err, { email, productId: product._id });
  }
};

// 13. PROMOTIONS: Marketing Promotional Campaigns
export const sendMarketingPromoEmail = async (email, name, promoData) => {
  const { title, subtitle, image, ctaText, ctaLink, description } = promoData;
  console.log(`🔍 [DEBUG] sendMarketingPromoEmail triggered for: ${email}`);
  if (!resend) return;

  const content = `
    <!-- Icon -->
    <tr>
      <td style="padding:32px 40px 0 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:52px; height:52px; border-radius:50%; background-color:#EAF3F1; text-align:center; vertical-align:middle;">
              <span style="font-size:24px; line-height:52px; color:#0F4C4F;">🌊</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 40px 4px 40px;" align="center">
        <h1 style="margin:0; font-size:26px; font-weight:700; color:#12312E; letter-spacing:-0.3px;">${title}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 40px 28px 40px;" align="center">
        <p style="margin:0; font-size:14px; color:#7A8785;">${subtitle}</p>
      </td>
    </tr>

    <!-- Divider -->
    <tr><td style="padding:0 40px;"><div style="height:1px; background-color:#EFEBE2;"></div></td></tr>

    <!-- Optional promo image -->
    ${image ? `
    <tr>
      <td style="padding:24px 40px 12px 40px;" align="center">
        <div style="border-radius:12px; overflow:hidden; border:1px solid #E2EEEC; background-color:#ffffff;">
          <img src="${image}" alt="${title}" style="width:100%; display:block; max-height:240px; object-fit:cover;">
        </div>
      </td>
    </tr>
    ` : ''}

    <!-- Description -->
    <tr>
      <td style="padding:16px 40px 24px 40px;">
        <p style="margin:0; font-size:15px; line-height:24px; color:#3D4744;">
          ${description}
        </p>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:8px 40px 36px 40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="${btnWrapperStyle}">
              <a href="${ctaLink || API_URL}" style="${btnStyle}">${ctaText || 'Shop Fresh Catch'} &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  try {
    const result = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: `${title} — SeaBite`,
      html: emailWrapper(content, `${title} — SeaBite`)
    });
    logEmailSuccess("MARKETING_PROMO", email);
    return result;
  } catch (err) {
    logEmailError("MARKETING_PROMO_EMAIL", err, { email });
  }
};

// 14. BATCH MARKETING: Send Promotional Campaign to Multi-Users
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