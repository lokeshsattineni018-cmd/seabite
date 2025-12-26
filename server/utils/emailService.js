import { Resend } from 'resend';

// Initialize Resend with your API Key
const resend = new Resend(process.env.RESEND_API_KEY);

// Official domain identity
const SENDER_IDENTITY = 'SeaBite Official <orders@seabite.co.in>';

// Helper to wrap content in a professional SeaBite layout
const emailTemplate = (content) => `
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden;">
    <div style="background-color: #0f172a; padding: 25px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">SeaBite</h1>
    </div>
    <div style="padding: 30px; color: #334155; line-height: 1.6;">
      ${content}
    </div>
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; 2025 SeaBite India. All rights reserved.</p>
    </div>
  </div>
`;

// 🟢 NEW: Specifically for first-time signups
export const sendWelcomeEmail = async (email, name) => {
  const content = `
    <h2 style="color: #0f172a;">Welcome to SeaBite, ${name}! 🌊</h2>
    <p>We are thrilled to have you join our community of seafood lovers. Your account has been successfully created via Google.</p>
    <p>Get ready to explore the freshest catch delivered straight to your doorstep.</p>
    <div style="margin: 20px 0; text-align: center;">
       <a href="https://seabite.co.in" style="background-color: #0f172a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Start Ordering</a>
    </div>
  `;
  return await resend.emails.send({
    from: SENDER_IDENTITY,
    to: email,
    subject: 'Welcome to SeaBite! 🌊',
    html: emailTemplate(content),
  });
};

export const sendLoginNotification = async (email, name) => {
  const content = `
    <h2 style="color: #0f172a;">Welcome back, ${name}!</h2>
    <p>A new login was detected for your SeaBite account. If this was you, you can safely ignore this email.</p>
    <p style="font-size: 13px; color: #64748b;">Logged in at: ${new Date().toLocaleString()}</p>
  `;
  return await resend.emails.send({
    from: SENDER_IDENTITY,
    to: email,
    subject: 'Security Alert: New Login Detected',
    html: emailTemplate(content),
  });
};

export const sendOrderPlacedEmail = async (email, name, orderId, total) => {
  const content = `
    <h2 style="color: #10b981;">Order Confirmed!</h2>
    <p>Hi ${name}, your order <strong>#${orderId}</strong> has been received and is being prepared by our chefs.</p>
    <div style="margin: 20px 0; padding: 15px; background: #f1f5f9; border-radius: 8px;">
      <p style="margin: 0;"><strong>Amount Paid:</strong> ₹${total.toLocaleString()}</p>
      <p style="margin: 0;"><strong>Estimated Delivery:</strong> 45-60 Minutes</p>
    </div>
    <p>Thank you for choosing SeaBite!</p>
  `;
  return await resend.emails.send({
    from: SENDER_IDENTITY,
    to: email,
    subject: `SeaBite Order Confirmation: #${orderId}`,
    html: emailTemplate(content),
  });
};

export const sendOrderShippedEmail = async (email, name, orderId) => {
  const content = `
    <h2 style="color: #3b82f6;">Your order is on the way!</h2>
    <p>Great news, ${name}! Your order <strong>#${orderId}</strong> is with our delivery partner and will reach you shortly.</p>
    <div style="text-align: center; margin: 30px 0;">
       <span style="font-size: 40px;">🚚</span>
    </div>
  `;
  return await resend.emails.send({
    from: SENDER_IDENTITY,
    to: email,
    subject: `SeaBite Order Out for Delivery: #${orderId}`,
    html: emailTemplate(content),
  });
};

export const sendOrderDeliveredEmail = async (email, name, orderId) => {
  const content = `
    <h2 style="color: #0f172a;">Freshness Delivered!</h2>
    <p>Hi ${name}, your order <strong>#${orderId}</strong> has been delivered successfully.</p>
    <p>Bon Appétit!</p>
  `;
  return await resend.emails.send({
    from: SENDER_IDENTITY,
    to: email,
    subject: `Delivered: Order #${orderId}`,
    html: emailTemplate(content),
  });
};