import Alert from "../models/Alert.js";
import NearbyAlert from "../models/NearbyAlert.js";
import NearbyAlertHistory from "../models/NearbyAlertHistory.js";
import FamilyAlert from "../models/FamilyAlert.js";
import User from "../models/User.js";
import sendWhatsApp from "../utils/sendWhatsApp.js";
import sendEmail from "../utils/sendEmail.js";
import { emergencyEmailTemplate } from "../utils/emailTemplate.js";
import { io } from "../../server.js";

// ✅ Reverse geocode - full address
const getAddressFromCoords = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      { headers: { "User-Agent": "SafeGuard-Safety-App/1.0" } },
    );
    const data = await response.json();
    return data.display_name || null;
  } catch {
    return null;
  }
};

// ✅ Reverse geocode - area only
const getAreaFromCoords = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
      { headers: { "User-Agent": "SafeGuard-Safety-App/1.0" } },
    );
    const data = await response.json();

    const area =
      data.address?.suburb ||
      data.address?.neighbourhood ||
      data.address?.quarter ||
      data.address?.district ||
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      null;

    const city =
      data.address?.city || data.address?.town || data.address?.village || null;

    return area ? `${area}${city && area !== city ? `, ${city}` : ""}` : city;
  } catch {
    return null;
  }
};

// ✅ Calculate distance
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ✅ Dynamic radius
const getDynamicRadius = async (lat, lon) => {
  const radii = [2000, 5000, 10000];

  for (const radius of radii) {
    const radiusDeg = radius / 111000;

    const nearbyCount = await User.countDocuments({
      "lastKnownLocation.latitude": {
        $gte: lat - radiusDeg,
        $lte: lat + radiusDeg,
      },
      "lastKnownLocation.longitude": {
        $gte: lon - radiusDeg,
        $lte: lon + radiusDeg,
      },
      "lastKnownLocation.updatedAt": {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      "settings.privacy.receiveSOSFromNearby": true,
    });

    if (nearbyCount >= 3) {
      console.log(`📍 Using radius: ${radius}m (found ${nearbyCount} users)`);
      return radius;
    }
  }

  return 10000;
};

// ✅ TRIGGER EMERGENCY ALERT
export const triggerAlert = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude, type } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const emailEnabled = user.settings?.notifications?.emailAlerts !== false;
    const whatsappEnabled =
      user.settings?.notifications?.whatsappAlerts !== false;
    const sendToNearby = user.settings?.privacy?.sendSOSToNearby === true;
    const isAnonymous = user.settings?.privacy?.anonymousMode === true;
    const shareWithFamily =
      user.settings?.privacy?.shareLocationFamily !== false;

    // ✅ Strict location check
    const hasLocation =
      latitude !== null &&
      latitude !== undefined &&
      longitude !== null &&
      longitude !== undefined &&
      !isNaN(parseFloat(latitude)) &&
      !isNaN(parseFloat(longitude));

    let fullAddress = null;
    let areaName = null;

    if (hasLocation) {
      [fullAddress, areaName] = await Promise.all([
        getAddressFromCoords(latitude, longitude),
        getAreaFromCoords(latitude, longitude),
      ]);
    }

    const coordsText = hasLocation
      ? `Lat: ${parseFloat(latitude).toFixed(6)}, Lng: ${parseFloat(longitude).toFixed(6)}`
      : "Location unavailable";

    const locationDisplay =
      fullAddress || (hasLocation ? coordsText : "Location unavailable");
    const mapsLink = hasLocation
      ? `https://maps.google.com/?q=${latitude},${longitude}`
      : null;

    // ============================================
    // ✅ STEP 1 - Notify Emergency Contacts
    // ============================================
    const whatsappMessage = `🆘 *EMERGENCY ALERT*\n\n*${user.fullName}* needs immediate help!\n\n📍 *Location:*\n${locationDisplay}\n\n🗺 *Google Maps:*\n${mapsLink || "Location not available"}\n\n⏰ *Time:* ${new Date().toLocaleString("en-IN")}\n\nPlease respond immediately or call *112* for emergency services.\n\n_Sent by SafeGuard Emergency System_ 🛡️`;

    const emailHtml = emergencyEmailTemplate({
      userName: user.fullName,
      location: locationDisplay,
      latitude: hasLocation ? parseFloat(latitude) : null,
      longitude: hasLocation ? parseFloat(longitude) : null,
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

        if (contact.phone && whatsappEnabled) {
          const waResult = await sendWhatsApp(contact.phone, whatsappMessage);
          notifyResult.whatsappSent = waResult.success;
          notifyResult.whatsappError = waResult.error || null;
        } else if (!whatsappEnabled) {
          notifyResult.whatsappError = "WhatsApp alerts disabled by user";
        }

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

    // ✅ Save main alert
    const alert = await Alert.create({
      userId,
      type: type || "Panic Button",
      location: {
        latitude: hasLocation ? parseFloat(latitude) : null,
        longitude: hasLocation ? parseFloat(longitude) : null,
        address: locationDisplay,
        mapsLink: mapsLink || null,
      },
      contactsNotified,
      status,
    });

    // ============================================
    // ✅ STEP 2 - Save FamilyAlert + Notify Family
    // ============================================
    if (shareWithFamily) {
      try {
        // ✅ Find all users who have this user in their linkedUsers
        const familyMembers = await User.find({
          "linkedUsers.userId": userId,
        }).select("_id");

        const familyIds = familyMembers.map((f) => f._id);

        // ✅ Save FamilyAlert to DB
        const familyAlert = await FamilyAlert.create({
          triggeredBy: {
            userId,
            userName: user.fullName,
          },
          notifiedFamilyIds: familyIds,
          type: type || "Panic Button",
          location: {
            latitude: hasLocation ? parseFloat(latitude) : null,
            longitude: hasLocation ? parseFloat(longitude) : null,
            address: locationDisplay,
            mapsLink: mapsLink || null,
            available: hasLocation,
          },
        });

        console.log(
          `✅ FamilyAlert saved to DB: ${familyAlert._id} for ${familyIds.length} family members`,
        );

        // ✅ Emit socket to family watchers
        io.to(`watch_${userId}`).emit("emergency_alert", {
          familyAlertId: familyAlert._id,
          userId,
          userName: user.fullName,
          type: type || "Panic Button",
          latitude: hasLocation ? parseFloat(latitude) : null,
          longitude: hasLocation ? parseFloat(longitude) : null,
          address: locationDisplay,
          mapsLink: mapsLink || null,
          locationAvailable: hasLocation,
          timestamp: new Date(),
        });
      } catch (familyError) {
        console.error("Failed to save/emit family alert:", familyError);
        // ✅ Don't fail the whole request if family alert fails
      }
    }

    // ============================================
    // ✅ STEP 3 - Notify Nearby Users
    // ============================================
    let nearbyNotifiedCount = 0;

    if (sendToNearby && hasLocation) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);

      const radius = await getDynamicRadius(lat, lon);
      const radiusDeg = radius / 111000;

      const nearbyUsers = await User.find({
        _id: { $ne: userId },
        "lastKnownLocation.latitude": {
          $gte: lat - radiusDeg,
          $lte: lat + radiusDeg,
        },
        "lastKnownLocation.longitude": {
          $gte: lon - radiusDeg,
          $lte: lon + radiusDeg,
        },
        "lastKnownLocation.updatedAt": {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        "settings.privacy.receiveSOSFromNearby": true,
      }).select("_id lastKnownLocation settings");

      const filteredNearby = nearbyUsers.filter((nearbyUser) => {
        if (!nearbyUser.lastKnownLocation?.latitude) return false;
        const dist = calculateDistance(
          lat,
          lon,
          nearbyUser.lastKnownLocation.latitude,
          nearbyUser.lastKnownLocation.longitude,
        );
        return dist <= radius / 1000;
      });

      console.log(
        `📍 Found ${filteredNearby.length} nearby users within ${radius}m`,
      );

      for (const nearbyUser of filteredNearby) {
        const dist = calculateDistance(
          lat,
          lon,
          nearbyUser.lastKnownLocation.latitude,
          nearbyUser.lastKnownLocation.longitude,
        );

        const distanceKm = parseFloat(dist.toFixed(1));

        const exactLocationData =
          isAnonymous && hasLocation
            ? {
                latitude: lat,
                longitude: lon,
                address: locationDisplay,
                mapsLink,
              }
            : {
                latitude: null,
                longitude: null,
                address: null,
                mapsLink: null,
              };

        const nearbyAlert = await NearbyAlert.create({
          alertId: alert._id,
          victimId: userId,
          victimGender: user.gender,
          receiverId: nearbyUser._id,
          distance: distanceKm,
          areaName: areaName || "Nearby area",
          exactLocation: exactLocationData,
          isExactLocation: isAnonymous,
          victimName: isAnonymous ? user.fullName : null,
          alertType: type || "Panic Button",
          dashboardStatus: "unseen",
        });

        await NearbyAlertHistory.create({
          alertId: alert._id,
          victimId: userId,
          victimGender: user.gender,
          receiverId: nearbyUser._id,
          distance: distanceKm,
          areaName: areaName || "Nearby area",
          exactLocation: exactLocationData,
          isExactLocation: isAnonymous,
          victimName: isAnonymous ? user.fullName : null,
          alertType: type || "Panic Button",
          receivedAt: new Date(),
        });

        const socketPayload = {
          nearbyAlertId: nearbyAlert._id,
          alertId: alert._id,
          victimGender: user.gender,
          distance: distanceKm,
          areaName: areaName || "Nearby area",
          alertType: type || "Panic Button",
          timestamp: new Date(),
          ...(isAnonymous && {
            victimName: user.fullName,
            latitude: lat,
            longitude: lon,
            address: locationDisplay,
            mapsLink,
          }),
        };

        io.to(`user_${nearbyUser._id}`).emit("nearby_emergency", socketPayload);
        nearbyNotifiedCount++;
      }

      await Alert.findByIdAndUpdate(alert._id, {
        nearbyUsersNotified: nearbyNotifiedCount,
      });
    }

    // ✅ Confirmation email to victim
    const emailEnabled2 = user.settings?.notifications?.emailAlerts !== false;
    if (user.email && emailEnabled2) {
      const confirmHtml = `
        <div style="font-family: Arial; padding: 30px; background: #f8f9fa;">
          <div style="background: white; border-radius: 16px; padding: 25px; max-width: 500px; margin: 0 auto; border-left: 5px solid #E91E8C;">
            <h2 style="color: #1A1A2E;">✅ Emergency Alert Sent</h2>
            <p style="color: #555;">Sent to <strong>${contactsNotified.length}</strong> emergency contact(s).</p>
            ${nearbyNotifiedCount > 0 ? `<p style="color: #555;">📣 <strong>${nearbyNotifiedCount}</strong> nearby SafeGuard user(s) also notified.</p>` : ""}
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
        nearbyUsersNotified: nearbyNotifiedCount,
        location: locationDisplay,
        mapsLink: mapsLink || null,
        locationAvailable: hasLocation,
      },
    });
  } catch (error) {
    console.error("Alert error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to trigger alert: " + error.message,
    });
  }
};

// ✅ GET ALERT HISTORY (own alerts)
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
    res.status(200).json({ success: true, alert });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get alert",
    });
  }
};

// ✅ DELETE SINGLE ALERT
export const deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }
    await Alert.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Alert deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete alert",
    });
  }
};

// ✅ GET FAMILY ALERTS
export const getFamilyAlerts = async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ Find alerts where this user is in notifiedFamilyIds
    const alerts = await FamilyAlert.find({
      notifiedFamilyIds: userId,
    })
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
      message: "Failed to get family alerts",
    });
  }
};
