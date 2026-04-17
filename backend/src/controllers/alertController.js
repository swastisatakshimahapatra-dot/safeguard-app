import Alert from "../models/Alert.js";
import User from "../models/User.js";
import sendWhatsApp from "../utils/sendWhatsApp.js";
import sendEmail from "../utils/sendEmail.js";
import { emergencyEmailTemplate } from "../utils/emailTemplate.js";
import { io } from "../../server.js";

// ✅ Reverse geocode
const getAddressFromCoords = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "SafeGuard-Safety-App/1.0",
        },
      },
    );
    const data = await response.json();
    return data.display_name || null;
  } catch (error) {
    console.log("⚠ Geocode failed:", error.message);
    return null;
  }
};

// ✅ TRIGGER EMERGENCY ALERT
export const triggerAlert = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude, type } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // ✅ Read user notification settings
    const emailEnabled = user.settings?.notifications?.emailAlerts !== false;
    const whatsappEnabled =
      user.settings?.notifications?.whatsappAlerts !== false;

    let placeName = null;
    if (latitude && longitude) {
      placeName = await getAddressFromCoords(latitude, longitude);
    }

    const coordsText =
      latitude && longitude
        ? `Lat: ${parseFloat(latitude).toFixed(6)}, Lng: ${parseFloat(longitude).toFixed(6)}`
        : "Location unavailable";

    const locationDisplay = placeName || coordsText;

    const mapsLink =
      latitude && longitude
        ? `https://maps.google.com/?q=${latitude},${longitude}`
        : null;

    const whatsappMessage = `🆘 *EMERGENCY ALERT*\n\n*${user.fullName}* needs immediate help!\n\n📍 *Location:*\n${locationDisplay}\n\n🗺 *Google Maps:*\n${mapsLink || "Location not available"}\n\n⏰ *Time:* ${new Date().toLocaleString("en-IN")}\n\nPlease respond immediately or call *112* for emergency services.\n\n_Sent by SafeGuard Emergency System_ 🛡️`;

    const emailHtml = emergencyEmailTemplate({
      userName: user.fullName,
      location: locationDisplay,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      mapsLink: mapsLink || "#",
      time: new Date().toLocaleString("en-IN", {
        dateStyle: "full",
        timeStyle: "short",
      }),
      alertType: type || "Panic Button",
    });

    const contactsNotified = [];

    if (user.emergencyContacts && user.emergencyContacts.length > 0) {
      for (const contact of user.emergencyContacts) {
        const notifyResult = {
          name: contact.name,
          phone: contact.phone,
          email: contact.email || null,
          whatsappSent: false,
          whatsappError: null,
          emailSent: false,
          emailError: null,
        };

        // ✅ Only send WhatsApp if setting is ON
        if (contact.phone && whatsappEnabled) {
          const waResult = await sendWhatsApp(contact.phone, whatsappMessage);
          notifyResult.whatsappSent = waResult.success;
          notifyResult.whatsappError = waResult.error || null;
        } else if (!whatsappEnabled) {
          notifyResult.whatsappError = "WhatsApp alerts disabled by user";
        }

        // ✅ Only send Email if setting is ON
        if (contact.email && emailEnabled) {
          const emailResult = await sendEmail(
            contact.email,
            `🆘 EMERGENCY: ${user.fullName} needs help!`,
            emailHtml,
          );
          notifyResult.emailSent = emailResult.success;
          notifyResult.emailError = emailResult.error || null;
        } else if (!emailEnabled) {
          notifyResult.emailError = "Email alerts disabled by user";
        }

        contactsNotified.push(notifyResult);
      }
    }

    // ✅ Community alerts - notify nearby users if setting is ON
    const communityEnabled =
      user.settings?.notifications?.communityAlerts !== false;
    const shareWithCommunity =
      user.settings?.privacy?.shareLocationCommunity === true;

    if (communityEnabled && shareWithCommunity && latitude && longitude) {
      // Emit to all connected socket users
      io.emit("community_emergency", {
        userId,
        userName: user.fullName,
        type: type || "Panic Button",
        latitude,
        longitude,
        address: locationDisplay,
        mapsLink,
        timestamp: new Date(),
      });
    }

    // ✅ Family tracking alert - notify family if shareLocationFamily is ON
    const shareWithFamily =
      user.settings?.privacy?.shareLocationFamily !== false;
    if (shareWithFamily) {
      io.to(`watch_${userId}`).emit("emergency_alert", {
        userId,
        userName: user.fullName,
        type: type || "Panic Button",
        latitude,
        longitude,
        address: locationDisplay,
        mapsLink,
        timestamp: new Date(),
      });
    }

    const anySuccess = contactsNotified.some(
      (c) => c.whatsappSent || c.emailSent,
    );
    const allSuccess = contactsNotified.every(
      (c) => c.whatsappSent || c.emailSent,
    );
    const status =
      contactsNotified.length === 0
        ? "Failed"
        : allSuccess
          ? "Sent"
          : anySuccess
            ? "Partial"
            : "Failed";

    const alert = await Alert.create({
      userId,
      type: type || "Panic Button",
      location: {
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        address: locationDisplay,
        mapsLink: mapsLink || null,
      },
      contactsNotified,
      status,
    });

    // Confirmation email to user
    if (user.email && emailEnabled) {
      const confirmHtml = `
        <div style="font-family: Arial; padding: 30px; background: #f8f9fa;">
          <div style="background: white; border-radius: 16px; padding: 25px; max-width: 500px; margin: 0 auto; border-left: 5px solid #E91E8C;">
            <h2 style="color: #1A1A2E;">✅ Emergency Alert Sent</h2>
            <p style="color: #555;">Your emergency alert has been sent to <strong>${contactsNotified.length}</strong> contact(s).</p>
            <p style="color: #555;">📍 <strong>Location:</strong> ${locationDisplay}</p>
            ${mapsLink ? `<p><a href="${mapsLink}" style="color: #E91E8C; font-weight: bold;">📍 View on Google Maps</a></p>` : ""}
            <p style="color: #999; font-size: 12px; margin-top: 15px;">SafeGuard Emergency System 🛡️</p>
          </div>
        </div>`;
      await sendEmail(
        user.email,
        `✅ Your emergency alert was sent - SafeGuard`,
        confirmHtml,
      );
    }

    res.status(201).json({
      success: true,
      message: "Emergency alert sent",
      alert: {
        id: alert._id,
        status,
        contactsCount: contactsNotified.length,
        whatsappSentCount: contactsNotified.filter((c) => c.whatsappSent)
          .length,
        emailSentCount: contactsNotified.filter((c) => c.emailSent).length,
        location: locationDisplay,
        mapsLink,
      },
    });
  } catch (error) {
    console.error("❌ Alert error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to trigger alert: " + error.message,
      });
  }
};

// ✅ GET ALERT HISTORY
export const getAlertHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const alerts = await Alert.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get alerts",
    });
  }
};

// ✅ GET SINGLE ALERT
export const getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }
    res.status(200).json({
      success: true,
      alert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get alert",
    });
  }
};
