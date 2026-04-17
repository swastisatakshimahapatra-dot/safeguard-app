import twilio from "twilio";

const sendSMS = async (to, message) => {
  try {
    // ✅ Check credentials exist
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_PHONE
    ) {
      console.log("⚠ Twilio not configured - skipping SMS");
      return { success: false, error: "Twilio not configured" };
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );

    // ✅ Format number
    let formattedPhone = to.toString().trim().replace(/\s/g, "");
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+91" + formattedPhone;
    }

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: formattedPhone,
    });

    console.log(`✅ SMS sent to ${formattedPhone}: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error(`❌ SMS failed to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

export default sendSMS;
