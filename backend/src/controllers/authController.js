import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Alert from "../models/Alert.js";
import Location from "../models/Location.js";
import LinkRequest from "../models/LinkRequest.js";

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

export const register = async (req, res) => {
  try {
    const { fullName, email, phone, password, gender, role, contacts } =
      req.body;
    if (!fullName || !email || !phone || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please provide all required fields",
        });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Email already registered. Please login.",
        });
    }
    const validContacts = Array.isArray(contacts)
      ? contacts.filter((c) => c.name && c.phone)
      : [];
    const user = await User.create({
      fullName,
      email,
      phone,
      password,
      gender: gender || "Other",
      role: role || "user",
      emergencyContacts: validContacts,
    });
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        gender: user.gender,
        settings: user.settings,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    res
      .status(500)
      .json({
        success: false,
        message: "Registration failed: " + error.message,
      });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        gender: user.gender,
        settings: user.settings,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Login failed: " + error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, gender } = req.body;
    if (!fullName || !fullName.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }
    const allowedGenders = ["Female", "Male", "Other"];
    if (gender && !allowedGenders.includes(gender)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid gender value" });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName: fullName.trim(), gender: gender || "Other" },
      { new: true, runValidators: true },
    ).select("-password");
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        gender: user.gender,
        settings: user.settings,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update profile" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "New password is required" });
    }
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters with uppercase, lowercase, number and special character",
      });
    }
    const user = await User.findById(req.user.id);
    user.password = newPassword;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to change password" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { settings },
      { new: true },
    ).select("-password");
    res
      .status(200)
      .json({
        success: true,
        message: "Settings updated",
        settings: user.settings,
      });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update settings" });
  }
};

export const clearAlertHistory = async (req, res) => {
  try {
    await Alert.deleteMany({ userId: req.user.id });
    res.status(200).json({ success: true, message: "Alert history cleared" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to clear history" });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    await Alert.deleteMany({ userId });
    await Location.deleteMany({ userId });
    await User.findByIdAndDelete(userId);
    res
      .status(200)
      .json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete account" });
  }
};

export const getLinkedUsers = async (req, res) => {
  try {
    const familyUser = await User.findById(req.user.id).populate(
      "linkedUsers.userId",
      "fullName email phone gender role",
    );
    if (!familyUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const linkedWithLocation = await Promise.all(
      familyUser.linkedUsers.map(async (linked) => {
        const u = linked.userId;
        if (!u) return null;
        const lastLocation = await Location.findOne({ userId: u._id }).sort({
          createdAt: -1,
        });
        const recentAlerts = await Alert.find({ userId: u._id })
          .sort({ createdAt: -1 })
          .limit(3);
        return {
          id: u._id,
          name: u.fullName,
          email: u.email,
          phone: u.phone,
          gender: u.gender,
          relation: linked.relation,
          location: lastLocation
            ? {
                latitude: lastLocation.latitude,
                longitude: lastLocation.longitude,
                accuracy: lastLocation.accuracy,
                lastUpdated: lastLocation.createdAt,
              }
            : null,
          alertCount: recentAlerts.length,
          recentAlerts,
        };
      }),
    );
    res
      .status(200)
      .json({ success: true, linkedUsers: linkedWithLocation.filter(Boolean) });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to get linked users" });
  }
};

export const unlinkUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const familyUser = await User.findById(req.user.id);
    familyUser.linkedUsers = familyUser.linkedUsers.filter(
      (l) => l.userId.toString() !== userId,
    );
    await familyUser.save();
    res
      .status(200)
      .json({ success: true, message: "User unlinked successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to unlink user" });
  }
};

// ✅ SEND LINK REQUEST
export const sendLinkRequest = async (req, res) => {
  try {
    const { email, relation } = req.body;
    if (!email || !relation) {
      return res
        .status(400)
        .json({ success: false, message: "Email and relation required" });
    }
    const targetUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    if (!targetUser) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No SafeGuard user found with this email",
        });
    }
    if (targetUser._id.toString() === req.user.id) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot link yourself" });
    }
    const requester = await User.findById(req.user.id);
    const alreadyLinked = requester.linkedUsers?.some(
      (l) => l.userId.toString() === targetUser._id.toString(),
    );
    if (alreadyLinked) {
      return res
        .status(400)
        .json({ success: false, message: "Already linked" });
    }
    const existing = await LinkRequest.findOne({
      fromUserId: req.user.id,
      toUserId: targetUser._id,
      status: "pending",
    });
    if (existing) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Request already sent, waiting for approval",
        });
    }
    const request = await LinkRequest.create({
      fromUserId: req.user.id,
      toUserId: targetUser._id,
      fromUserName: requester.fullName,
      fromUserEmail: requester.email,
      relation,
    });

    // ✅ Emit to target user's room
    const { io } = await import("../../server.js");
    io.to(`user_${targetUser._id}`).emit("link_request", {
      requestId: request._id,
      fromUserName: requester.fullName,
      fromUserEmail: requester.email,
      relation,
    });

    res.status(200).json({
      success: true,
      message: `Request sent to ${targetUser.fullName}. Waiting for approval.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send request" });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const requests = await LinkRequest.find({
      toUserId: req.user.id,
      status: "pending",
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get requests" });
  }
};

export const getSentRequests = async (req, res) => {
  try {
    const requests = await LinkRequest.find({ fromUserId: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, requests });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to get sent requests" });
  }
};

// ✅ RESPOND TO REQUEST - emits to family dashboard immediately
export const respondToLinkRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body;
    const request = await LinkRequest.findById(requestId);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }
    if (request.toUserId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    request.status = action;
    await request.save();

    const { io } = await import("../../server.js");

    if (action === "accepted") {
      // ✅ Add to family member's linkedUsers
      await User.findByIdAndUpdate(request.fromUserId, {
        $push: {
          linkedUsers: {
            userId: request.toUserId,
            relation: request.relation,
          },
        },
      });

      // ✅ Get the accepted user's data + last location to send to family
      const acceptedUser = await User.findById(request.toUserId).select(
        "-password",
      );
      const lastLocation = await Location.findOne({
        userId: request.toUserId,
      }).sort({ createdAt: -1 });

      // ✅ Emit to family member's room with full user data
      io.to(`user_${request.fromUserId}`).emit("link_request_accepted", {
        user: {
          id: acceptedUser._id,
          name: acceptedUser.fullName,
          email: acceptedUser.email,
          phone: acceptedUser.phone,
          gender: acceptedUser.gender,
          relation: request.relation,
          location: lastLocation
            ? {
                latitude: lastLocation.latitude,
                longitude: lastLocation.longitude,
                accuracy: lastLocation.accuracy,
                lastUpdated: lastLocation.createdAt,
              }
            : null,
          alertCount: 0,
        },
      });
    } else {
      // ✅ Emit denial to family member
      io.to(`user_${request.fromUserId}`).emit("link_request_denied", {
        userName: (await User.findById(request.toUserId))?.fullName,
      });
    }

    res.status(200).json({
      success: true,
      message: action === "accepted" ? "Request accepted" : "Request denied",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to respond" });
  }
};
