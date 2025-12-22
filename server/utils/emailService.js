import nodemailer from 'nodemailer';

// 1. Configure the Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

// 🟢 PROFESSIONAL SENDER NAME CONFIGURATION
// This will make emails arrive as "SeaBite Official" <your-email@gmail.com>
const SENDER_IDENTITY = `"SeaBite Official" <${process.env.EMAIL_USER}>`;

// Helper: Common Email Styles (SeaBite Branding)
const getHtmlTemplate = (title, bodyContent) => `
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">
    
    <div style="background-color: #0f172a; padding: 30px 20px; text-align: center; background-image: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
      <h1 style="color: #ffffff; margin: 0; font-family: 'Playfair Display', serif; font-size: 28px; letter-spacing: 1px;">SeaBite 🌊</h1>
      <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Fresh Catch Delivery</p>
    </div>

    <div style="padding: 40px 30px; color: #334155;">
      <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; text-align: center; margin-bottom: 25px;">${title}</h2>
      <div style="line-height: 1.8; font-size: 15px;">
        ${bodyContent}
      </div>
    </div>

    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #64748b; margin: 0;">&copy; ${new Date().getFullYear()} SeaBite Inc.</p>
      <p style="font-size: 11px; color: #94a3b8; margin: 5px 0 0 0;">123 Ocean Drive, Coastal City</p>
    </div>
  </div>
`;

// =========================================================
// 📧 1. SEND LOGIN NOTIFICATION
// =========================================================
export const sendLoginNotification = async (email, name) => {
  const subject = 'Security Alert: New Login Detected';
  const html = getHtmlTemplate(
    'Welcome Back!',
    `<p>Hi <strong>${name}</strong>,</p>
     <p>We just detected a new login to your SeaBite account.</p>
     <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <strong>Time:</strong> ${new Date().toLocaleString()}<br>
        <strong>Device:</strong> Web Browser
     </div>
     <p>If this was you, you can ignore this email. Happy shopping! 🦞</p>`
  );

  await transporter.sendMail({ from: SENDER_IDENTITY, to: email, subject, html });
};

// =========================================================
// 📧 2. SEND ORDER PLACED EMAIL
// =========================================================
export const sendOrderPlacedEmail = async (email, name, orderId, total) => {
  const subject = `Order Confirmed: #${orderId}`;
  const html = getHtmlTemplate(
    'We Received Your Order! 🎣',
    `<p>Hi <strong>${name}</strong>,</p>
     <p>Thank you for choosing SeaBite! Your fresh catch is being prepared.</p>
     <div style="border-left: 4px solid #f43f5e; padding-left: 15px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order ID:</strong> #${orderId}</p>
        <p style="margin: 5px 0;"><strong>Total Amount:</strong> $${total}</p>
     </div>
     <p>You will receive another update once your package ships.</p>
     <div style="text-align: center; margin-top: 30px;">
        <a href="http://localhost:5173/orders" style="background-color: #0f172a; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 14px;">View Your Order</a>
     </div>`
  );

  await transporter.sendMail({ from: SENDER_IDENTITY, to: email, subject, html });
};

// =========================================================
// 📧 3. SEND ORDER SHIPPED EMAIL
// =========================================================
export const sendOrderShippedEmail = async (email, name, orderId) => {
  const subject = `Your Order #${orderId} has Shipped! 🚚`;
  const html = getHtmlTemplate(
    'On Its Way!',
    `<p>Hi <strong>${name}</strong>,</p>
     <p>Great news! Your SeaBite order has left our facility and is heading your way.</p>
     <p>Please ensure someone is available to receive the fresh package.</p>`
  );

  await transporter.sendMail({ from: SENDER_IDENTITY, to: email, subject, html });
};

// =========================================================
// 📧 4. SEND ORDER DELIVERED EMAIL
// =========================================================
export const sendOrderDeliveredEmail = async (email, name, orderId) => {
  const subject = `Delivered: Order #${orderId}`;
  const html = getHtmlTemplate(
    'Package Arrived! 🍽️',
    `<p>Hi <strong>${name}</strong>,</p>
     <p>Your order has been successfully delivered.</p>
     <p>We hope you enjoy your meal! Don't forget to refrigerate your items immediately.</p>
     <p style="margin-top: 20px;"><strong>Enjoy the fresh taste of the ocean!</strong></p>`
  );

  await transporter.sendMail({ from: SENDER_IDENTITY, to: email, subject, html });
};