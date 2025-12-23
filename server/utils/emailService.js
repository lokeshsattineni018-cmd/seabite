import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

const SENDER_IDENTITY = `"SeaBite Official" <${process.env.OFFICIAL_EMAIL}>`;

// 🟢 MAKE SURE 'export const' IS USED FOR EVERY FUNCTION
export const sendLoginNotification = async (email, name) => {
  const subject = 'Security Alert: New Login';
  const html = `<h1>Welcome back ${name}</h1>`;
  return await transporter.sendMail({ from: SENDER_IDENTITY, to: email, subject, html });
};

export const sendOrderPlacedEmail = async (email, name, orderId, total) => {
  const subject = `Order Confirmed: #${orderId}`;
  const html = `<h1>Order of ₹${total} received!</h1>`;
  return await transporter.sendMail({ from: SENDER_IDENTITY, to: email, subject, html });
};

export const sendOrderShippedEmail = async (email, name, orderId) => {
  const subject = `Shipped: #${orderId}`;
  return await transporter.sendMail({ from: SENDER_IDENTITY, to: email, subject, html: 'Shipped!' });
};

export const sendOrderDeliveredEmail = async (email, name, orderId) => {
  const subject = `Delivered: #${orderId}`;
  return await transporter.sendMail({ from: SENDER_IDENTITY, to: email, subject, html: 'Delivered!' });
};