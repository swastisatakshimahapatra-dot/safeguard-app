import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import Alert from "../models/Alert.js";
import Location from "../models/Location.js";
import LinkRequest from "../models/LinkRequest.js";
import sendEmail from "../utils/sendEmail.js";
import NearbyAlert from "../models/NearbyAlert.js";
import NearbyAlertHistory from "../models/NearbyAlertHistory.js";

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// ✅ Verification email template
const verificationEmailTemplate = (userName, verifyUrl) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f8f9fa; margin: 0; padding: 0;">
  <div style="max-width: 500px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    
    <div style="background: linear-gradient(135deg, #1A1A2E, #E91E8C); padding: 30px; text-align: center;">
      <div style="font-size: 40px; margin-bottom: 8px;">🛡️</div>
      <h1 style="color: white; margin: 0; font-size: 24px;">SafeGuard</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">Email Verification</p>
    </div>

    <div style="padding: 30px;">
      <h2 style="color: #1A1A2E; margin: 0 0 12px;">Hi ${userName}! 👋</h2>
      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Thanks for registering with SafeGuard. Please verify your email address to complete your registration and activate your account.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" 
          style="display: inline-block; background: linear-gradient(135deg, #E91E8C, #ff4b91); 
          color: white; text-decoration: none; padding: 16px 40px; 
          border-radius: 50px; font-weight: 700; font-size: 16px;
          box-shadow: 0 4px 15px rgba(233,30,140,0.4);">
          ✅ Verify My Email
        </a>
      </div>

      <p style="color: #999; font-size: 13px; text-align: center;">
        This link expires in <strong>24 hours</strong>
      </p>

      <div style="background: #f8f9fa; border-radius: 12px; padding: 16px; margin-top: 20px;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          If the button doesn't work, copy and paste this link:<br/>
          <a href="${verifyUrl}" style="color: #E91E8C; word-break: break-all; font-size: 11px;">${verifyUrl}</a>
        </p>
      </div>

      <p style="color: #bbb; font-size: 12px; margin-top: 20px; text-align: center;">
        If you didn't create a SafeGuard account, ignore this email.
      </p>
    </div>

    <div style="background: #1A1A2E; padding: 20px; text-align: center;">
      <p style="color: rgba(255,255,255,0.4); margin: 0; font-size: 12px;">
        © 2024 SafeGuard. Protecting Women & Children 24/7 🛡️
      </p>
    </div>
  </div>
</body>
</html>
`;

// ✅ REGISTER - Send verification email
export const register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      gender,
      role,
      contacts,
      latitude, // ✅ NEW - from registration form
      longitude, // ✅ NEW - from registration form
    } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: "Email already registered. Please login.",
        });
      } else {
        const verifyToken = crypto.randomBytes(32).toString("hex");
        existingUser.emailVerifyToken = verifyToken;
        existingUser.emailVerifyExpires = new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        );
        await existingUser.save();
        const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verifyToken}`;
        await sendEmail(
          email,
          "✅ Verify Your SafeGuard Email",
          verificationEmailTemplate(existingUser.fullName, verifyUrl),
        );
        return res.status(200).json({
          success: true,
          message: "Verification email resent! Please check your inbox.",
          requiresVerification: true,
        });
      }
    }

    const validContacts = Array.isArray(contacts)
      ? contacts.filter((c) => c.name && c.phone)
      : [];

    const verifyToken = crypto.randomBytes(32).toString("hex");

    // ✅ Get city/area from registration coords if provided
    let lastKnownLocation = {
      latitude: null,
      longitude: null,
      city: null,
      area: null,
      updatedAt: null,
    };

    if (latitude && longitude) {
      const { city, area } = await getCityFromCoords(latitude, longitude);
      lastKnownLocation = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        city,
        area,
        updatedAt: new Date(),
      };
    }

    const user = await User.create({
      fullName,
      email,
      phone,
      password,
      gender: gender || "Other",
      role: role || "user",
      emergencyContacts: validContacts,
      isEmailVerified: false,
      emailVerifyToken: verifyToken,
      emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      lastKnownLocation, // ✅ Save location from registration
    });

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verifyToken}`;
    await sendEmail(
      email,
      "✅ Verify Your SafeGuard Email",
      verificationEmailTemplate(user.fullName, verifyUrl),
    );

    res.status(201).json({
      success: true,
      message: "Account created! Please check your email to verify.",
      requiresVerification: true,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    res.status(500).json({
      success: false,
      message: "Registration failed: " + error.message,
    });
  }
};

// ✅ VERIFY EMAIL
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerifyToken: token,
      emailVerifyExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link",
      });
    }

    // ✅ Mark as verified
    user.isEmailVerified = true;
    user.emailVerifyToken = null;
    user.emailVerifyExpires = null;
    await user.save();

    // ✅ Return token so user is auto-logged in
    const jwtToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Email verified successfully! Welcome to SafeGuard 🎉",
      token: jwtToken,
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
    res.status(500).json({
      success: false,
      message: "Verification failed: " + error.message,
    });
  }
};

// ✅ LOGIN - Block unverified + specific error messages
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    // ✅ Specific error - no generic message
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "No account found with this email address",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password. Please try again.",
      });
    }

    // ✅ Block unverified users
    if (!user.isEmailVerified) {
      // Resend verification email
      const verifyToken = crypto.randomBytes(32).toString("hex");
      user.emailVerifyToken = verifyToken;
      user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await user.save();

      const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verifyToken}`;
      await sendEmail(
        email,
        "✅ Verify Your SafeGuard Email",
        verificationEmailTemplate(user.fullName, verifyUrl),
      );

      return res.status(403).json({
        success: false,
        message:
          "Email not verified. A new verification link has been sent to your email.",
        requiresVerification: true,
      });
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
    res.status(500).json({
      success: false,
      message: "Login failed: " + error.message,
    });
  }
};

export const sendVerificationEmailHandler = async (req, res) => {
  try {
    const { fullName, email, phone, password, gender } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if already exists and verified
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already registered. Please login.",
      });
    }

    // ✅ Generate token
    const verifyToken = crypto.randomBytes(32).toString("hex");

    if (existingUser && !existingUser.isEmailVerified) {
      // Update existing unverified user
      existingUser.emailVerifyToken = verifyToken;
      existingUser.emailVerifyExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      );
      await existingUser.save();
    } else {
      // Create new unverified user
      await User.create({
        fullName,
        email,
        phone,
        password,
        gender: gender || "Other",
        isEmailVerified: false,
        emailVerifyToken: verifyToken,
        emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    }

    // ✅ Send email
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verifyToken}`;
    await sendEmail(
      email,
      "✅ Verify Your SafeGuard Email",
      verificationEmailTemplate(fullName, verifyUrl),
    );

    res.status(200).json({
      success: true,
      message: "Verification email sent! Please check your inbox.",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already registered. Please login.",
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to send verification: " + error.message,
    });
  }
};

export const checkEmailRoute = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user && user.isEmailVerified) {
      return res.status(200).json({
        exists: true,
        verified: true,
        message: "Email already registered. Please login.",
      });
    }

    if (user && !user.isEmailVerified) {
      return res.status(200).json({
        exists: true,
        verified: false,
        message: "Email registered but not verified. Please check your inbox.",
      });
    }

    return res.status(200).json({
      exists: false,
    });
  } catch (error) {
    res.status(500).json({ exists: false });
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
    res.status(200).json({
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
    // ✅ NEW - clean nearby alert data
    await NearbyAlert.deleteMany({
      $or: [{ victimId: userId }, { receiverId: userId }],
    });
    await NearbyAlertHistory.deleteMany({
      $or: [{ victimId: userId }, { receiverId: userId }],
    });
    await User.findByIdAndDelete(userId);
    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
    });
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
      return res.status(404).json({
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
      return res.status(400).json({
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

const getCityFromCoords = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
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
