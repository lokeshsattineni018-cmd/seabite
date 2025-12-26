import { Resend } from 'resend';

// Initialize Resend with your API Key
const resend = new Resend(process.env.RESEND_API_KEY);

// 🟢 Dual Sender Identities
const OFFICIAL_SENDER = 'SeaBite Official <official@seabite.co.in>';
const ORDERS_SENDER = 'SeaBite Orders <orders@seabite.co.in>';

// 🟢 Premium High-Level Email Wrapper
const emailTemplate = (content, title) => `
  <div style="background-color: #f4f7f9; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.1);">
      <div style="background: #0f172a; padding: 35px; text-align: center;">
        <img src="https://seabite.co.in/logo.png" alt="SeaBite Logo" style="width: 160px; height: auto; margin-bottom: 15px;">
        <h2 style="color: #38bdf8; margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 3px; font-weight: 400;">${title}</h2>
      </div>
      
      <div style="padding: 40px; color: #334155; line-height: 1.8; font-size: 16px;">
        ${content}
      </div>
      
      <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0; font-size: 13px; color: #94a3b8; font-weight: 500;">
          Premium Seafood Experience • SeaBite India
        </p>
        <div style="margin-top: 15px;">
          <a href="https://seabite.co.in" style="color: #38bdf8; text-decoration: none; font-size: 12px; margin: 0 10px;">Visit Store</a>
          <a href="https://seabite.co.in/profile" style="color: #38bdf8; text-decoration: none; font-size: 12px; margin: 0 10px;">Your Account</a>
        </div>
      </div>
    </div>
  </div>
`;

// 🟢 LOGIN / AUTH EMAILS (From: official@seabite.co.in)
export const sendWelcomeEmail = async (email, name) => {
  const content = `
    <h1 style="color: #0f172a; font-size: 24px;">Welcome to the Family, ${name}! 🌊</h1>
    <p>We're excited to have you on board. Your journey to the freshest catch in India starts today.</p>
    <p>Your account is officially verified. Start exploring our menu and experience the ocean's best delivered to your doorstep.</p>
    <div style="margin: 30px 0; text-align: center;">
       <a href="https://seabite.co.in" style="background-color: #0f172a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Browse the Catch</a>
    </div>
  `;
  return await resend.emails.send({
    from: OFFICIAL_SENDER,
    to: email,
    subject: 'Welcome to SeaBite! Your Seafood Journey Begins',
    html: emailTemplate(content, 'Account Verified'),
  });
};

export const sendLoginNotification = async (email, name) => {
  const content = `
    <h1 style="color: #0f172a; font-size: 22px;">Security Notification</h1>
    <p>Hello ${name}, a new login was detected for your SeaBite account.</p>
    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      <p style="margin: 0; font-size: 14px;"><strong>Action:</strong> Google Login Successful</p>
    </div>
    <p style="font-size: 14px;">If this wasn't you, please secure your Google account immediately.</p>
  `;
  return await resend.emails.send({
    from: OFFICIAL_SENDER,
    to: email,
    subject: 'Security Alert: New Login to SeaBite',
    html: emailTemplate(content, 'Secure Login'),
  });
};

// 🟢 TRANSACTIONAL / ORDER EMAILS (From: orders@seabite.co.in)
export const sendOrderPlacedEmail = async (email, name, orderId, total, items) => {
  // Generate rows for the item summary table
  const itemRows = items && items.length > 0 ? items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
        <span style="font-weight: 600; color: #0f172a; display: block;">${item.name}</span>
        <span style="font-size: 12px; color: #64748b;">Qty: ${item.qty}</span>
      </td>
      <td style="padding: 12px 0; text-align: right; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 500;">
        ₹${(item.price * item.qty).toLocaleString()}
      </td>
    </tr>
  `).join('') : '';

  const content = `
    <h1 style="color: #10b981; font-size: 24px;">Order Confirmed!</h1>
    <p>Hi ${name}, we've received your order <strong>#${orderId}</strong>. Our chefs are preparing your fresh catch now.</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr>
          <th style="text-align: left; font-size: 12px; text-transform: uppercase; color: #94a3b8; padding-bottom: 10px; border-bottom: 2px solid #f1f5f9;">Item</th>
          <th style="text-align: right; font-size: 12px; text-transform: uppercase; color: #94a3b8; padding-bottom: 10px; border-bottom: 2px solid #f1f5f9;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
      <tfoot>
        <tr>
          <td style="padding-top: 20px; font-weight: bold; color: #0f172a;">Total Paid</td>
          <td style="padding-top: 20px; text-align: right; font-weight: bold; color: #10b981; font-size: 18px;">
            ₹${total.toLocaleString()}
          </td>
        </tr>
      </tfoot>
    </table>

    <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0; margin-top: 20px; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #166534;">
        Estimated delivery: <strong>45-60 Minutes</strong>
      </p>
    </div>
  `;

  return await resend.emails.send({
    from: ORDERS_SENDER,
    to: email,
    subject: `SeaBite Order Confirmation: #${orderId}`,
    html: emailTemplate(content, 'Order Received'),
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
    <h1 style="color: ${statusColors[status] || '#0f172a'}; font-size: 24px;">Order Status: ${status}</h1>
    <p>Hello ${name}, the status of your order <strong>#${orderId}</strong> has been updated.</p>
    <div style="text-align: center; margin: 30px 0;">
       <div style="display: inline-block; padding: 25px; background: #f8fafc; border-radius: 50%; border: 2px solid ${statusColors[status] || '#cbd5e1'};">
         <span style="font-size: 45px;">📦</span>
       </div>
    </div>
    <p>Current Status: <strong style="color: ${statusColors[status] || '#0f172a'}; text-transform: uppercase;">${status}</strong></p>
    <p>We're working hard to get your order to you as quickly as possible. Thank you for choosing SeaBite!</p>
  `;
  return await resend.emails.send({
    from: ORDERS_SENDER,
    to: email,
    subject: `Update: Order #${orderId} is ${status}`,
    html: emailTemplate(content, 'Order Progress Update'),
  });
};