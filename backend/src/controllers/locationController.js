import Location from "../models/Location.js";
import { io } from "../../server.js";

// ✅ Save location for logged-in user
export const saveLocation = async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;

    // ✅ Get userId from token
    const userId = req.user.id;

    const newLocation = await Location.create({
      userId,
      latitude,
      longitude,
      accuracy,
    });

    // ✅ Emit real-time update to watchers
    io.to(`watch_${userId}`).emit("location_update", {
      userId,
      latitude,
      longitude,
      accuracy,
      timestamp: new Date(),
    });

    console.log(`📍 Location saved for user: ${userId}`);

    res.status(201).json({
      success: true,
      message: "Location saved",
      data: newLocation,
    });
  } catch (error) {
    console.error("❌ Location save error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save location",
    });
  }
};

// ✅ Get last location
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

    res.status(200).json({
      success: true,
      data: location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get location",
    });
  }
};
