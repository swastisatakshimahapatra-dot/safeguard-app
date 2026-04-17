import nodemailer from "nodemailer";

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const brevoUser = process.env.BREVO_USER?.trim();
    const brevoPass = process.env.BREVO_PASS?.trim();
    const brevoFrom = process.env.BREVO_FROM?.trim();

    console.log("📧 Email attempt to:", to);
    console.log("📧 BREVO_USER:", brevoUser);
    console.log("📧 BREVO_PASS first 15 chars:", brevoPass?.substring(0, 15));
    console.log("📧 BREVO_FROM:", brevoFrom);

    if (!brevoUser || !brevoPass) {
      console.log("❌ Brevo credentials missing");
      return { success: false, error: "Email credentials not configured" };
    }

    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: brevoUser,
        pass: brevoPass,
      },
    });

    await transporter.verify();
    console.log("✅ SMTP verified!");

    const result = await transporter.sendMail({
      from: brevoFrom,
      to: to.trim(),
      subject,
      html: htmlContent,
    });

    console.log(`✅ Email sent to ${to}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Email failed:", error.message);
    console.error("❌ Error code:", error.code);
    console.error("❌ Response:", error.response);
    return { success: false, error: error.message };
  }
};

export default sendEmail;
