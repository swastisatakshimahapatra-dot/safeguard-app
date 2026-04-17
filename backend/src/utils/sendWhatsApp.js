import twilio from 'twilio'

const sendWhatsApp = async (to, message) => {
  try {
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN
    ) {
      console.log('⚠ Twilio not configured')
      return { success: false, error: 'Twilio not configured' }
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    // ✅ Format phone number
    let formattedPhone = to.toString().trim().replace(/\s/g, '')
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone
    }

    console.log(`📱 WhatsApp from: whatsapp:+14155238886`)
    console.log(`📱 WhatsApp to: whatsapp:${formattedPhone}`)

    const result = await client.messages.create({
      from: 'whatsapp:+14155238886',   // ✅ Hardcoded correctly
      to: `whatsapp:${formattedPhone}`,
      body: message,
    })

    console.log(`✅ WhatsApp sent to ${formattedPhone}: ${result.sid}`)
    return { success: true, sid: result.sid }

  } catch (error) {
    console.error(`❌ WhatsApp failed to ${to}:`, error.message)
    return { success: false, error: error.message }
  }
}

export default sendWhatsApp