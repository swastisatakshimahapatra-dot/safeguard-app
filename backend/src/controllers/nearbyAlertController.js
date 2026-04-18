import NearbyAlert from "../models/NearbyAlert.js";
import NearbyAlertHistory from "../models/NearbyAlertHistory.js";
import HelperAction from "../models/HelperAction.js";
import User from "../models/User.js";
import { io } from "../../server.js";

// ✅ GET - Dashboard unseen nearby alerts
export const getUnseenNearbyAlerts = async (req, res) => {
  try {
    const receiverId = req.user.id;

    const alerts = await NearbyAlert.find({
      receiverId,
      dashboardStatus: "unseen",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get nearby alerts",
    });
  }
};

// ✅ GET - Alert History Tab 2 (received nearby alerts)
export const getNearbyAlertHistory = async (req, res) => {
  try {
    const receiverId = req.user.id;

    const history = await NearbyAlertHistory.find({ receiverId })
      .sort({ receivedAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: history.length,
      alerts: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get nearby alert history",
    });
  }
};

// ✅ MARK AS SEEN - removes from dashboard, stays in history
export const markNearbyAlertSeen = async (req, res) => {
  try {
    const { nearbyAlertId } = req.params;
    const receiverId = req.user.id;

    const nearbyAlert = await NearbyAlert.findOne({
      _id: nearbyAlertId,
      receiverId,
    });

    if (!nearbyAlert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    // ✅ Update NearbyAlert status to seen
    nearbyAlert.dashboardStatus = "seen";
    nearbyAlert.helperAction = "seen";
    nearbyAlert.helperActionAt = new Date();
    await nearbyAlert.save();

    // ✅ Update NearbyAlertHistory with seen action
    await NearbyAlertHistory.findOneAndUpdate(
      {
        alertId: nearbyAlert.alertId,
        receiverId,
      },
      { helperAction: "seen" },
    );

    // ✅ Log helper action
    await HelperAction.create({
      nearbyAlertId: nearbyAlert._id,
      alertId: nearbyAlert.alertId,
      helperId: receiverId,
      victimId: nearbyAlert.victimId,
      action: "seen",
    });

    res.status(200).json({
      success: true,
      message: "Marked as seen",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark as seen",
    });
  }
};

// ✅ HELPER ACTION - called_police or going_to_help
export const takeHelperAction = async (req, res) => {
  try {
    const { nearbyAlertId, action } = req.body;
    const helperId = req.user.id;

    if (!["called_police", "going_to_help"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action",
      });
    }

    const nearbyAlert = await NearbyAlert.findOne({
      _id: nearbyAlertId,
      receiverId: helperId,
    });

    if (!nearbyAlert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    const helper = await User.findById(helperId).select(
      "fullName gender lastKnownLocation",
    );

    // ✅ Update NearbyAlert
    nearbyAlert.dashboardStatus = "seen";
    nearbyAlert.helperAction = action;
    nearbyAlert.helperActionAt = new Date();

    let locationExpiresAt = null;

    if (action === "going_to_help") {
      // ✅ Share location for 30 min
      locationExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
      nearbyAlert.isHelperLocationShared = true;
      nearbyAlert.helperLocationExpiresAt = locationExpiresAt;
    }

    await nearbyAlert.save();

    // ✅ Update NearbyAlertHistory
    await NearbyAlertHistory.findOneAndUpdate(
      {
        alertId: nearbyAlert.alertId,
        receiverId: helperId,
      },
      { helperAction: action },
    );

    // ✅ Create HelperAction record
    const helperActionRecord = await HelperAction.create({
      nearbyAlertId: nearbyAlert._id,
      alertId: nearbyAlert.alertId,
      helperId,
      victimId: nearbyAlert.victimId,
      action,
      isLocationShared: action === "going_to_help",
      locationExpiresAt,
    });

    // ✅ Notify victim via socket
    const victimSocketPayload = {
      helperId,
      helperName: helper.fullName,
      helperGender: helper.gender,
      action,
      alertId: nearbyAlert.alertId,
      helperActionId: helperActionRecord._id,
      timestamp: new Date(),
    };

    if (action === "going_to_help") {
      // ✅ Include helper location if available
      victimSocketPayload.helperLocation = helper.lastKnownLocation?.latitude
        ? {
            latitude: helper.lastKnownLocation.latitude,
            longitude: helper.lastKnownLocation.longitude,
          }
        : null;
      victimSocketPayload.locationExpiresAt = locationExpiresAt;
    }

    io.to(`user_${nearbyAlert.victimId}`).emit(
      "helper_action",
      victimSocketPayload,
    );

    res.status(200).json({
      success: true,
      message:
        action === "called_police"
          ? "Police called. Victim has been notified."
          : "Going to help. Your location will be shared for 30 minutes.",
      helperActionId: helperActionRecord._id,
      locationExpiresAt,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to take action",
    });
  }
};

// ✅ DELETE from nearby alert history (manual delete by user)
export const deleteNearbyAlertHistory = async (req, res) => {
  try {
    const { historyId } = req.params;
    const receiverId = req.user.id;

    const record = await NearbyAlertHistory.findOne({
      _id: historyId,
      receiverId,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    await NearbyAlertHistory.findByIdAndDelete(historyId);

    res.status(200).json({
      success: true,
      message: "Alert removed from history",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete",
    });
  }
};

// ✅ GET helper actions for a specific alert (victim sees who helped)
export const getHelperActions = async (req, res) => {
  try {
    const { alertId } = req.params;
    const userId = req.user.id;

    const actions = await HelperAction.find({ alertId, victimId: userId })
      .populate("helperId", "fullName gender")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      actions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get helper actions",
    });
  }
};
