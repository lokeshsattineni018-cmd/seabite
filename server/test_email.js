
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config({ path: './.env' });

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const OFFICIAL_SENDER = 'SeaBite Official <official@seabite.co.in>';

async function testEmail() {
  if (!resend) {
    console.error("❌ No RESEND_API_KEY found");
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: 'lokeshsattineni018@gmail.com',
      subject: 'Test Email from SeaBite',
      html: '<h1>Test Email</h1><p>If you see this, the email service is working.</p>'
    });

    if (error) {
      console.error("❌ Resend Error:", error);
    } else {
      console.log("✅ Email sent successfully:", data);
    }
  } catch (err) {
    console.error("❌ Execution Error:", err);
  }
}

testEmail();
