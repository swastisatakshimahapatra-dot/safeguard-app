import Location from "../models/Location.js";
import User from "../models/User.js";
import { io } from "../../server.js";

// ✅ Reverse geocode for area name
const getAreaFromCoords = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
      { headers: { "User-Agent": "SafeGuard-Safety-App/1.0" } },
    );
    const data = await response.json();

    const city =
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.county ||
      null;

    const area =
      data.address?.suburb ||
      data.address?.neighbourhood ||
      data.address?.quarter ||
      data.address?.district ||
      city ||
      null;

    return { city, area };
  } catch {
    return { city: null, area: null };
  }
};

// ✅ Save location + update lastKnownLocation on user
export const saveLocation = async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    const userId = req.user.id;

    // ✅ Save to Location collection (for tracking history)
    const newLocation = await Location.create({
      userId,
      latitude,
      longitude,
      accuracy,
    });

    // ✅ Update lastKnownLocation on user
    // Only reverse geocode every 10th update to avoid rate limiting
    // Use a simple counter based on minutes
    const now = new Date();
    const user = await User.findById(userId).select("lastKnownLocation");
    const lastUpdate = user?.lastKnownLocation?.updatedAt;
    const minutesSinceUpdate = lastUpdate
      ? (now - new Date(lastUpdate)) / 1000 / 60
      : 999;

    // ✅ Only geocode if last geocode was more than 10 minutes ago
    let city = user?.lastKnownLocation?.city || null;
    let area = user?.lastKnownLocation?.area || null;

    if (minutesSinceUpdate > 10) {
      const geocoded = await getAreaFromCoords(latitude, longitude);
      city = geocoded.city;
      area = geocoded.area;
    }

    // ✅ Always update lat/lon, only update city/area when geocoded
    await User.findByIdAndUpdate(userId, {
      lastKnownLocation: {
        latitude,
        longitude,
        city,
        area,
        updatedAt: now,
      },
    });

    // ✅ Emit real-time update to watchers (family dashboard)
    io.to(`watch_${userId}`).emit("location_update", {
      userId,
      latitude,
      longitude,
      accuracy,
      timestamp: now,
    });

    console.log(`📍 Location saved + lastKnownLocation updated: ${userId}`);

    res.status(201).json({
      success: true,
      message: "Location saved",
      data: newLocation,
    });
  } catch (error) {
    console.error("Location save error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save location",
    });
  }
};

// ✅ Get last location (unchanged)
export const getLastLocation = async (req, res) => {
  try {
    const { userId } = req.params;
    const location = await Location.findOne({ userId }).sort({ createdAt: -1 });
    if (!location) {
      return res.status(404).json({
        success: false,
        message: "No location found",
      });
    }
    res.status(200).json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get location",
    });
  }
};
