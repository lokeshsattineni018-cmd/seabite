import nodemailer from 'nodemailer';

// ✅ FIXED: Configured for Brevo SMTP instead of Gmail
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.BREVO_USER,      // Your Brevo login email
    pass: process.env.BREVO_SMTP_KEY,  // Your Brevo SMTP Key
  },
});

// ✅ FIXED: Using official info@seabite.co.in identity
const SENDER_IDENTITY = `"SeaBite Official" <${process.env.OFFICIAL_EMAIL}>`;

const getHtmlTemplate = (title, bodyContent) => `
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">
    <div style="background-color: #0f172a; padding: 30px 20px; text-align: center; background-image: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
      <h1 style="color: #ffffff; margin: 0; font-family: 'Playfair Display', serif; font-size: 28px; letter-spacing: 1px;">SeaBite 🌊</h1>
      <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Fresh Catch Delivery</p>
    </div>
    <div style="padding: 40px 30px; color: #334155;">
      <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; text-align: center; margin-bottom: 25px;">${title}</h2>
      <div style="line-height: 1.8; font-size: 15px;">${bodyContent}</div>
    </div>
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #64748b; margin: 0;">&copy; ${new Date().getFullYear()} SeaBite Inc.</p>
      <p style="font-size: 11px; color: #94a3b8; margin: 5px 0 0 0;">Official Delivery Partner of Fresh Seafood</p>
    </div>
  </div>
`;

export const sendLoginNotification = async (email, name) => {
  const subject = 'Security Alert: New Login Detected';
  const html = getHtmlTemplate('Welcome Back!', `<p>Hi <strong>${name}</strong>,</p><p>We detected a new login to your SeaBite account.</p>`);
  await transporter.sendMail({ from: SENDER_IDENTITY, to: email, subject, html });
};

export const sendOrderPlacedEmail = async (email, name, orderId, total) => {
  const subject = `Order Confirmed: #${orderId}`;
  const html = getHtmlTemplate('We Received Your Order! 🎣', `<p>Hi <strong>${name}</strong>,</p><p>Preparing your fresh catch. Order Total: ₹${total}</p>`);
  await transporter.sendMail({ from: SENDER_IDENTITY, to: email, subject, html });
};

export const sendOrderShippedEmail = async (email, name, orderId) => {
  const subject = `Your Order #${orderId} has Shipped! 🚚`;
  const html = getHtmlTemplate('On Its Way!', `<p>Hi <strong>${name}</strong>,</p><p>Your SeaBite order is heading your way.</p>`);
  await transporter.sendMail({ from: SENDER_IDENTITY, to: email, subject, html });
};

export const sendOrderDeliveredEmail = async (email, name, orderId) => {
  const subject = `Delivered: Order #${orderId}`;
  const html = getHtmlTemplate('Package Arrived! 🍽️', `<p>Hi <strong>${name}</strong>,</p><p>Your order has been successfully delivered.</p>`);
  await transporter.sendMail({ from: SENDER_IDENTITY, to: email, subject, html });
};