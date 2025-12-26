import { Resend } from 'resend';

// Initialize Resend with your API Key
const resend = new Resend(process.env.RESEND_API_KEY);

// 🟢 Dual Sender Identities
const OFFICIAL_SENDER = 'SeaBite Official <official@seabite.co.in>';
const ORDERS_SENDER = 'SeaBite Orders <orders@seabite.co.in>';

// 🟢 Premium High-Level Email Wrapper (Amazon/Flipkart Inspired)
const emailTemplate = (content, title) => `
  <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
      <div style="background: #0f172a; padding: 40px 20px; text-align: center;">
        <img src="https://seabite.co.in/logo.png" alt="SeaBite Logo" width="160" style="width: 160px; height: auto; margin-bottom: 10px; display: inline-block;">
        <h2 style="color: #38bdf8; margin: 10px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 4px; font-weight: 500;">${title}</h2>
      </div>
      
      <div style="padding: 40px; color: #1e293b; line-height: 1.6; font-size: 16px;">
        ${content}
      </div>
      
      <div style="background-color: #f1f5f9; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 600;">
          Premium Seafood Experience • SeaBite India
        </p>
        <p style="margin: 8px 0 15px 0; font-size: 11px; color: #94a3b8;">
          You received this because you are a registered SeaBite member.
        </p>
        <div style="margin-top: 15px;">
          <a href="https://seabite.co.in" style="color: #0284c7; text-decoration: none; font-size: 12px; font-weight: bold; margin: 0 12px;">Shop Now</a>
          <a href="https://seabite.co.in/profile" style="color: #0284c7; text-decoration: none; font-size: 12px; font-weight: bold; margin: 0 12px;">Manage Account</a>
        </div>
      </div>
    </div>
  </div>
`;

// 🟢 LOGIN / AUTH EMAILS (From: official@seabite.co.in)
export const sendWelcomeEmail = async (email, name) => {
  const content = `
    <h1 style="color: #0f172a; font-size: 26px; margin-bottom: 20px;">Welcome to SeaBite, ${name}! 🌊</h1>
    <p>We are thrilled to have you join our community. Your account has been successfully verified via Google.</p>
    <p>At SeaBite, we are committed to delivering the freshest catch directly from the docks to your doorstep.</p>
    <div style="margin: 35px 0; text-align: center;">
       <a href="https://seabite.co.in" style="background-color: #0f172a; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Explore Today's Catch</a>
    </div>
    <p style="font-size: 14px; color: #64748b; margin-top: 30px;">Happy Dining,<br><strong>The SeaBite Team</strong></p>
  `;
  return await resend.emails.send({
    from: OFFICIAL_SENDER,
    to: email,
    subject: 'Welcome to SeaBite! 🌊',
    html: emailTemplate(content, 'Account Verified'),
  });
};

export const sendLoginNotification = async (email, name) => {
  const content = `
    <h1 style="color: #0f172a; font-size: 22px;">New Login Detected</h1>
    <p>Hi ${name}, your SeaBite account was just accessed from a new device.</p>
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 25px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      <p style="margin: 0; font-size: 14px; color: #64748b;"><strong>Action:</strong> Secure Google Sign-In</p>
    </div>
    <p style="font-size: 14px; color: #ef4444; font-weight: 500;">If this wasn't you, please secure your account immediately by changing your credentials.</p>
  `;
  return await resend.emails.send({
    from: OFFICIAL_SENDER,
    to: email,
    subject: 'Security Alert: New Login for SeaBite',
    html: emailTemplate(content, 'Security Notification'),
  });
};

// 🟢 TRANSACTIONAL / ORDER EMAILS (From: orders@seabite.co.in)
export const sendOrderPlacedEmail = async (email, name, orderId, total, items) => {
  const itemRows = items && items.length > 0 ? items.map(item => `
    <tr>
      <td style="padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
        <span style="font-weight: 600; color: #0f172a; display: block;">${item.name}</span>
        <span style="font-size: 12px; color: #64748b;">Quantity: ${item.qty}</span>
      </td>
      <td style="padding: 15px 0; text-align: right; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600;">
        ₹${(item.price * item.qty).toLocaleString()}
      </td>
    </tr>
  `).join('') : '';

  const content = `
    <h1 style="color: #10b981; font-size: 24px; margin-bottom: 15px;">Order Confirmed!</h1>
    <p>Hi ${name}, we've received your order <strong>#${orderId}</strong>. Our chefs are preparing your items now.</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 30px 0;">
      <thead>
        <tr>
          <th style="text-align: left; font-size: 11px; text-transform: uppercase; color: #94a3b8; padding-bottom: 10px; border-bottom: 2px solid #f1f5f9; letter-spacing: 1px;">Item Details</th>
          <th style="text-align: right; font-size: 11px; text-transform: uppercase; color: #94a3b8; padding-bottom: 10px; border-bottom: 2px solid #f1f5f9; letter-spacing: 1px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
      <tfoot>
        <tr>
          <td style="padding-top: 25px; font-weight: bold; color: #0f172a; font-size: 18px;">Grand Total</td>
          <td style="padding-top: 25px; text-align: right; font-weight: bold; color: #10b981; font-size: 22px;">
            ₹${total.toLocaleString()}
          </td>
        </tr>
      </tfoot>
    </table>

    <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; border: 1px solid #bbf7d0; text-align: center;">
      <p style="margin: 0; font-size: 15px; color: #166534; font-weight: 500;">
        🚚 Your fresh seafood will arrive in <strong>45-60 Minutes</strong>
      </p>
    </div>
  `;

  return await resend.emails.send({
    from: ORDERS_SENDER,
    to: email,
    subject: `SeaBite Order Confirmation: #${orderId}`,
    html: emailTemplate(content, 'Invoice & Order Summary'),
  });
};

// 🟢 STATUS UPDATES (From: orders@seabite.co.in)
export const sendStatusUpdateEmail = async (email, name, orderId, status) => {
  const statusColors = { 
    'Processing': '#f59e0b', 
    'Shipped': '#3b82f6', 
    'Delivered': '#10b981',
    'Out for Delivery': '#8b5cf6' 
  };
  
  const content = `
    <h1 style="color: ${statusColors[status] || '#0f172a'}; font-size: 26px;">Order Update: ${status}</h1>
    <p>Hi ${name}, there is progress on your order <strong>#${orderId}</strong>.</p>
    <div style="text-align: center; margin: 40px 0;">
       <div style="display: inline-block; padding: 30px; background: #f8fafc; border-radius: 50%; border: 3px solid ${statusColors[status] || '#cbd5e1'};">
         <span style="font-size: 50px;">📦</span>
       </div>
    </div>
    <p style="text-align: center; font-size: 18px; color: #1e293b;">Your current order status is: <strong style="color: ${statusColors[status] || '#0f172a'}; text-transform: uppercase;">${status}</strong></p>
    <p style="margin-top: 30px;">Thank you for your patience as we ensure the highest quality for your meal.</p>
  `;
  return await resend.emails.send({
    from: ORDERS_SENDER,
    to: email,
    subject: `SeaBite: Order #${orderId} is ${status}`,
    html: emailTemplate(content, 'Order Progress Update'),
  });
};