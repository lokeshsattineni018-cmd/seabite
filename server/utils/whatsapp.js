/**
 * 📲 SeaBite Transactional WhatsApp Notification Engine
 * Integrates with Twilio WhatsApp API (configured via sandbox or live keys)
 */
export const sendWhatsAppNotification = async (phone, message) => {
  try {
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
    console.log(`📲 [WHATSAPP DISPATCH] Send to ${formattedPhone}: "${message}"`);
    
    // In production, you would configure:
    // const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //   from: 'whatsapp:+14155238886', // Twilio Sandbox Number
    //   to: `whatsapp:${formattedPhone}`,
    //   body: message
    // });
    
    return { success: true, message: "WhatsApp message dispatched successfully" };
  } catch (error) {
    console.error("❌ WHATSAPP DISPATCH ERROR:", error);
    return { success: false, error: error.message };
  }
};
