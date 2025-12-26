import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// 🟢 Identity specifically for Official/Security matters
const OFFICIAL_SENDER = 'SeaBite Official <official@seabite.co.in>';
const ORDERS_SENDER = 'SeaBite Orders <orders@seabite.co.in>';

/**
 * 🟢 1. AUTH: AMZ-STYLE SECURITY NOTIFICATION
 * Design: High-contrast, clean, and professional for security trust.
 */
export const sendLoginNotification = async (email, name) => {
  const istTime = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const html = `
    <div style="background-color: #f3f4f6; padding: 40px 10px; font-family: 'Arial', sans-serif;">
      <table align="center" width="100%" style="max-width: 550px; background: white; border-radius: 4px; border: 1px solid #ddd; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <tr>
          <td style="padding: 20px; border-bottom: 1px solid #eaeaea; text-align: center;">
            <img src="https://seabite.co.in/logo.png" width="140" alt="SeaBite">
          </td>
        </tr>
        <tr>
          <td style="padding: 30px;">
            <h1 style="font-size: 20px; color: #111; margin: 0 0 15px;">Security Notification</h1>
            <p style="font-size: 14px; color: #333;">Hello <b>${name}</b>,</p>
            <p style="font-size: 14px; color: #333;">A new login was detected for your SeaBite account. If this was you, you can safely disregard this email.</p>
            
            <div style="background: #fffdf5; border: 1px solid #f5d76e; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <table width="100%" style="font-size: 13px;">
                <tr><td style="color: #666; padding: 5px 0;">Time (IST):</td><td style="font-weight: bold; padding: 5px 0;">${istTime}</td></tr>
                <tr><td style="color: #666; padding: 5px 0;">Activity:</td><td style="font-weight: bold; padding: 5px 0;">Google Secure Login</td></tr>
              </table>
            </div>

            <p style="font-size: 12px; color: #777;">If this wasn't you, please change your password immediately or contact our support team at support@seabite.co.in.</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; background: #f9f9f9; text-align: center; font-size: 11px; color: #999;">
            © 2025 SeaBite India. Premium Seafood Experience.
          </td>
        </tr>
      </table>
    </div>
  `;

  return await resend.emails.send({
    from: OFFICIAL_SENDER,
    to: email,
    subject: 'Security Alert: New Login to SeaBite',
    html
  });
};

/**
 * 🟢 2. ORDER CONFIRMED: FLIPKART-STYLE CELEBRATORY RECEIPT
 * Design: Bright blue headers, itemized table, and clear delivery commitment.
 */
export const sendOrderPlacedEmail = async (email, name, orderId, total, items) => {
  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 15px 0; border-bottom: 1px solid #eee;">
        <span style="font-size: 14px; font-weight: bold; color: #212121; display: block;">${item.name}</span>
        <span style="font-size: 12px; color: #878787;">Quantity: ${item.qty}</span>
      </td>
      <td style="padding: 15px 0; text-align: right; border-bottom: 1px solid #eee; font-weight: bold; color: #212121;">₹${(item.price * item.qty).toLocaleString()}</td>
    </tr>
  `).join('');

  const html = `
    <div style="background-color: #f1f3f6; padding: 30px 10px; font-family: 'Roboto', Helvetica, Arial, sans-serif;">
      <table align="center" width="100%" style="max-width: 600px; background: white; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <tr style="background-color: #2874f0;">
          <td style="padding: 30px 20px; color: white;">
            <table width="100%">
              <tr>
                <td><img src="https://seabite.co.in/logo.png" width="110" style="filter: brightness(0) invert(1);"></td>
                <td style="text-align: right; font-size: 14px; opacity: 0.9;">Order Confirmed</td>
              </tr>
            </table>
            <h2 style="margin: 20px 0 0; font-size: 22px; font-weight: 500;">Your order is on the way, ${name}!</h2>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px;">
            <p style="font-size: 15px; color: #333;">Order <b>#${orderId}</b> has been received and is being prepared with the freshest catch.</p>
            
            <table width="100%" style="border-collapse: collapse; margin-top: 20px;">
              <thead>
                <tr style="text-align: left; font-size: 12px; color: #878787; text-transform: uppercase;">
                  <th style="padding-bottom: 10px; border-bottom: 1px solid #eee;">Item Summary</th>
                  <th style="padding-bottom: 10px; border-bottom: 1px solid #eee; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
              <tr>
                <td style="padding: 25px 0; font-size: 16px; font-weight: bold; color: #212121;">Total Paid</td>
                <td style="padding: 25px 0; text-align: right; font-size: 20px; color: #2874f0; font-weight: bold;">₹${total.toLocaleString()}</td>
              </tr>
            </table>
            
            <div style="margin-top: 25px; padding: 20px; background: #e3f2fd; border-radius: 8px; text-align: center; border: 1px solid #bbdefb;">
              <span style="color: #0d47a1; font-weight: bold; font-size: 16px;">🚚 Estimated Delivery: 2 - 3 Days</span>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;

  return await resend.emails.send({
    from: ORDERS_SENDER,
    to: email,
    subject: `SeaBite Order Confirmed: #${orderId}`,
    html
  });
};

/**
 * 🟢 3. STATUS UPDATES: UNIQUE DYNAMIC DESIGNS
 * Design: Features a visual progress bar and intent-specific colors (Blue for Shipped, Green for Delivered).
 */
export const sendStatusUpdateEmail = async (email, name, orderId, status) => {
  const isDelivered = status === 'Delivered';
  const isShipped = status === 'Shipped' || status === 'Out for Delivery';
  const isCancelled = status.toLowerCase().includes('cancel');
  
  const accentColor = isCancelled ? '#d32f2f' : (isDelivered ? '#388e3c' : '#2874f0');
  const headerBg = isCancelled ? '#f44336' : (isDelivered ? '#4caf50' : (isShipped ? '#2196f3' : '#ff9f00'));

  const html = `
    <div style="background-color: #f1f3f6; padding: 30px 10px; font-family: 'Arial', sans-serif;">
      <table align="center" width="100%" style="max-width: 600px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <tr style="background-color: ${headerBg};">
          <td style="padding: 40px 20px; text-align: center; color: white;">
             <div style="font-size: 50px; margin-bottom: 10px;">${isDelivered ? '🎁' : (isCancelled ? '🛑' : '🚚')}</div>
             <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Order ${status}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px;">
            <p style="font-size: 16px; color: #333;">Hi <b>${name}</b>, your order <b>#${orderId}</b> has a status update.</p>
            
            ${!isCancelled ? `
            <table width="100%" style="margin: 35px 0;">
              <tr>
                <td width="33%" style="height: 6px; background: ${accentColor}; border-radius: 3px 0 0 3px;"></td>
                <td width="33%" style="height: 6px; background: ${isShipped || isDelivered ? accentColor : '#e0e0e0'};"></td>
                <td width="33%" style="height: 6px; background: ${isDelivered ? accentColor : '#e0e0e0'}; border-radius: 0 3px 3px 0;"></td>
              </tr>
              <tr style="font-size: 10px; color: #9e9e9e; text-transform: uppercase; text-align: center;">
                <td style="padding-top: 10px; color: ${accentColor}; font-weight: bold;">Placed</td>
                <td style="padding-top: 10px; color: ${isShipped ? accentColor : '#9e9e9e'};">In Transit</td>
                <td style="padding-top: 10px; color: ${isDelivered ? accentColor : '#9e9e9e'};">Delivered</td>
              </tr>
            </table>
            ` : ''}

            <p style="background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 5px solid ${accentColor}; color: #555; font-size: 15px;">
              Current Status: <b>${status}</b>
            </p>
            
            <div style="text-align: center; margin-top: 40px;">
              <a href="https://seabite.co.in/profile" style="background: ${accentColor}; color: white; padding: 16px 35px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">Track Your Package</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; background: #fafafa; text-align: center; border-top: 1px solid #eee;">
            <span style="font-size: 12px; color: #999;">Need help? Contact support@seabite.co.in</span>
          </td>
        </tr>
      </table>
    </div>
  `;

  return await resend.emails.send({
    from: ORDERS_SENDER,
    to: email,
    subject: `SeaBite Update: Order #${orderId} is ${status}`,
    html
  });
};