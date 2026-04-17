import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiEye,
  FiEyeOff,
  FiSave,
  FiShield,
  FiBell,
  FiGlobe,
  FiTrash2,
  FiCheck,
  FiAlertCircle,
  FiLogOut,
} from "react-icons/fi";
import { MdLocationOn, MdNotifications } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import {
  updateProfile,
  changePassword,
  updateSettings,
  clearAlertHistory,
  deleteAccount,
  getProfile,
} from "../../services/authService";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const Toggle = ({ enabled, onToggle, disabled }) => (
  <button
    onClick={onToggle}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${
      enabled ? "bg-[#E91E8C]" : "bg-gray-200"
    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
        enabled ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText,
  confirmColor,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
            confirmColor === "red" ? "bg-red-100" : "bg-orange-100"
          }`}
        >
          <FiAlertCircle
            className={`text-3xl ${confirmColor === "red" ? "text-red-500" : "text-orange-500"}`}
          />
        </div>
        <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">{title}</h3>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 text-white font-semibold rounded-xl transition-colors ${
              confirmColor === "red"
                ? "bg-red-500 hover:bg-red-600"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    confirmColor: "red",
    onConfirm: null,
  });

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    gender: "Other",
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    whatsappAlerts: true,
    crimeZoneAlerts: true,
    communityAlerts: true,
  });

  const [privacy, setPrivacy] = useState({
    shareLocationFamily: true,
    shareLocationCommunity: false,
    anonymousMode: false,
  });

  // ✅ Always fetch fresh from DB on every mount — fixes toggle sync
  useEffect(() => {
    const fetchFreshSettings = async () => {
      try {
        const response = await getProfile();
        const freshUser = response.user;
        updateUser(freshUser);

        setProfileForm({
          fullName: freshUser.fullName || "",
          gender: freshUser.gender || "Other",
        });

        setNotifications({
          emailAlerts: freshUser.settings?.notifications?.emailAlerts ?? true,
          whatsappAlerts:
            freshUser.settings?.notifications?.whatsappAlerts ?? true,
          crimeZoneAlerts:
            freshUser.settings?.notifications?.crimeZoneAlerts ?? true,
          communityAlerts:
            freshUser.settings?.notifications?.communityAlerts ?? true,
        });

        setPrivacy({
          shareLocationFamily:
            freshUser.settings?.privacy?.shareLocationFamily ?? true,
          shareLocationCommunity:
            freshUser.settings?.privacy?.shareLocationCommunity ?? false,
          anonymousMode: freshUser.settings?.privacy?.anonymousMode ?? false,
        });
      } catch (error) {
        // Fallback to cached
        setProfileForm({
          fullName: user?.fullName || "",
          gender: user?.gender || "Other",
        });
        setNotifications({
          emailAlerts: user?.settings?.notifications?.emailAlerts ?? true,
          whatsappAlerts: user?.settings?.notifications?.whatsappAlerts ?? true,
          crimeZoneAlerts:
            user?.settings?.notifications?.crimeZoneAlerts ?? true,
          communityAlerts:
            user?.settings?.notifications?.communityAlerts ?? true,
        });
        setPrivacy({
          shareLocationFamily:
            user?.settings?.privacy?.shareLocationFamily ?? true,
          shareLocationCommunity:
            user?.settings?.privacy?.shareLocationCommunity ?? false,
          anonymousMode: user?.settings?.privacy?.anonymousMode ?? false,
        });
      } finally {
        setSettingsLoaded(true);
      }
    };

    fetchFreshSettings();
  }, []);

  const tabs = [
    { id: "profile", label: "Profile", icon: <FiUser /> },
    { id: "security", label: "Security", icon: <FiShield /> },
    { id: "notifications", label: "Alerts", icon: <FiBell /> },
    { id: "privacy", label: "Privacy", icon: <FiGlobe /> },
    { id: "danger", label: "Danger Zone", icon: <FiAlertCircle /> },
  ];

  const handleSaveProfile = async () => {
    if (!profileForm.fullName.trim()) {
      toast.error("Name is required");
      return;
    }
    setLoading(true);
    try {
      const response = await updateProfile({
        fullName: profileForm.fullName.trim(),
        gender: profileForm.gender,
      });
      updateUser(response.user);
      toast.success("Profile updated ✅");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (name === "newPassword") {
      setPasswordErrors((prev) => ({
        ...prev,
        newPassword: !value
          ? ""
          : !PASSWORD_REGEX.test(value)
            ? "Min 8 chars, uppercase, lowercase, number & special char (@$!%*?&)"
            : "",
      }));
    }
    if (name === "confirmPassword") {
      setPasswordErrors((prev) => ({
        ...prev,
        confirmPassword:
          value && value !== passwordForm.newPassword
            ? "Passwords do not match"
            : "",
      }));
    }
  };

  const handleSavePassword = async () => {
    if (!passwordForm.newPassword) {
      toast.error("Enter new password");
      return;
    }
    if (!PASSWORD_REGEX.test(passwordForm.newPassword)) {
      toast.error("Password does not meet requirements");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await changePassword({ newPassword: passwordForm.newPassword });
      toast.success("Password changed 🔐");
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Toggle notification — save to DB + update context immediately
  const handleToggleNotification = async (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated); // ✅ Update UI immediately

    try {
      const response = await updateSettings({
        notifications: updated,
        privacy,
      });
      // ✅ Update context so it persists across pages without refresh
      const freshResponse = await getProfile();
      updateUser(freshResponse.user);
      toast.success(
        `${updated[key] ? "✅ Enabled" : "❌ Disabled"}: ${key.replace(/([A-Z])/g, " $1").trim()}`,
      );
    } catch (error) {
      setNotifications(notifications); // Revert on failure
      toast.error("Failed to save setting");
    }
  };

  // ✅ Toggle privacy — save to DB + update context immediately
  const handleTogglePrivacy = async (key) => {
    const updated = { ...privacy, [key]: !privacy[key] };
    setPrivacy(updated);

    try {
      await updateSettings({ notifications, privacy: updated });
      const freshResponse = await getProfile();
      updateUser(freshResponse.user);
      toast.success(
        `${updated[key] ? "✅ Enabled" : "❌ Disabled"}: ${key.replace(/([A-Z])/g, " $1").trim()}`,
      );
    } catch (error) {
      setPrivacy(privacy);
      toast.error("Failed to save setting");
    }
  };

  const showConfirm = ({
    title,
    message,
    confirmText,
    confirmColor,
    onConfirm,
  }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      confirmColor,
      onConfirm,
    });
  };
  const closeConfirm = () =>
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

  const handleLogoutAll = () => {
    showConfirm({
      title: "Logout All Devices?",
      message:
        "You will be signed out from all active sessions including this one.",
      confirmText: "Yes, Logout All",
      confirmColor: "orange",
      onConfirm: () => {
        logout();
        navigate("/login");
        toast.success("Logged out");
        closeConfirm();
      },
    });
  };

  const handleClearHistory = () => {
    showConfirm({
      title: "Clear Alert History?",
      message:
        "This permanently deletes all your emergency alert records. Cannot be undone.",
      confirmText: "Yes, Clear All",
      confirmColor: "red",
      onConfirm: async () => {
        try {
          await clearAlertHistory();
          // ✅ Also clear family dashboard localStorage alerts
          localStorage.removeItem("safeguard_family_alerts");
          localStorage.removeItem("safeguard_danger_users");
          toast.success("Alert history cleared ✅");
          closeConfirm();
        } catch {
          toast.error("Failed");
          closeConfirm();
        }
      },
    });
  };

  const handleDeleteAccount = () => {
    showConfirm({
      title: "Delete Account?",
      message:
        "This permanently deletes your account, all alerts, locations and contacts. CANNOT be undone.",
      confirmText: "Yes, Delete Forever",
      confirmColor: "red",
      onConfirm: async () => {
        try {
          await deleteAccount();
          logout();
          toast.success("Account deleted");
          navigate("/");
          closeConfirm();
        } catch {
          toast.error("Failed");
          closeConfirm();
        }
      },
    });
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[@$!%*?&]/.test(pass)) score++;
    if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
    if (score <= 3) return { score, label: "Fair", color: "bg-yellow-500" };
    if (score <= 4) return { score, label: "Good", color: "bg-blue-500" };
    return { score, label: "Strong", color: "bg-green-500" };
  };

  const strength = getPasswordStrength(passwordForm.newPassword);

  // ✅ Show loader while fetching fresh settings
  if (!settingsLoaded) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#E91E8C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A2E]">
            Settings
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage your account and preferences
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-4 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.id
                    ? tab.id === "danger"
                      ? "border-red-500 text-red-500 bg-red-50/50"
                      : "border-[#E91E8C] text-[#E91E8C] bg-pink-50/50"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6">
            {/* ===== PROFILE ===== */}
            {activeTab === "profile" && (
              <div className="space-y-5">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#E91E8C] to-pink-700 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0">
                    {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-bold text-[#1A1A2E]">{user?.fullName}</p>
                    <p className="text-gray-400 text-sm">{user?.email}</p>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-pink-100 text-[#E91E8C] rounded-full capitalize">
                      {user?.role}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
                    Full Name <span className="text-[#E91E8C]">*</span>
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={profileForm.fullName}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          fullName: e.target.value,
                        }))
                      }
                      className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[#E91E8C] text-[#1A1A2E] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
                    Email{" "}
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      (cannot be changed)
                    </span>
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
                    Phone{" "}
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      (cannot be changed)
                    </span>
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      type="tel"
                      value={user?.phone || ""}
                      disabled
                      className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
                    Gender <span className="text-[#E91E8C]">*</span>
                  </label>
                  <div className="flex gap-2">
                    {["Female", "Male", "Other"].map((g) => (
                      <button
                        key={g}
                        onClick={() =>
                          setProfileForm((prev) => ({ ...prev, gender: g }))
                        }
                        className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          profileForm.gender === g
                            ? "border-[#E91E8C] bg-pink-50 text-[#E91E8C]"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#E91E8C] to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-70 w-full sm:w-auto"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiSave />
                  )}
                  Save Profile
                </button>
              </div>
            )}

            {/* ===== SECURITY ===== */}
            {activeTab === "security" && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <FiShield className="text-blue-500 text-2xl flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-[#1A1A2E] text-sm">
                      Change Password
                    </p>
                    <p className="text-gray-500 text-xs">
                      Must be 8+ chars with uppercase, lowercase, number,
                      special char
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showNewPass ? "text" : "password"}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Min 8 chars, A-Z, a-z, 0-9, @$!%*?&"
                      className={`w-full pl-11 pr-12 py-3.5 border-2 rounded-xl bg-gray-50 focus:outline-none transition-colors text-[#1A1A2E] placeholder-gray-400 ${
                        passwordErrors.newPassword
                          ? "border-red-400"
                          : passwordForm.newPassword &&
                              !passwordErrors.newPassword
                            ? "border-green-400"
                            : "border-gray-200 focus:border-[#E91E8C]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#E91E8C]"
                    >
                      {showNewPass ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {passwordForm.newPassword && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : "bg-gray-200"}`}
                          />
                        ))}
                      </div>
                      <p
                        className={`text-xs font-semibold ${
                          strength.label === "Strong"
                            ? "text-green-600"
                            : strength.label === "Good"
                              ? "text-blue-600"
                              : strength.label === "Fair"
                                ? "text-yellow-600"
                                : "text-red-600"
                        }`}
                      >
                        {strength.label}
                      </p>
                    </div>
                  )}
                  {passwordErrors.newPassword && (
                    <p className="text-red-500 text-xs mt-1.5">
                      ⚠ {passwordErrors.newPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Re-enter new password"
                      className={`w-full pl-11 pr-12 py-3.5 border-2 rounded-xl bg-gray-50 focus:outline-none transition-colors text-[#1A1A2E] placeholder-gray-400 ${
                        passwordErrors.confirmPassword
                          ? "border-red-400"
                          : passwordForm.confirmPassword &&
                              passwordForm.newPassword ===
                                passwordForm.confirmPassword
                            ? "border-green-400"
                            : "border-gray-200 focus:border-[#E91E8C]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#E91E8C]"
                    >
                      {showConfirmPass ? <FiEyeOff /> : <FiEye />}
                    </button>
                    {passwordForm.confirmPassword &&
                      passwordForm.newPassword ===
                        passwordForm.confirmPassword && (
                        <FiCheck className="absolute right-10 top-1/2 -translate-y-1/2 text-green-500" />
                      )}
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1.5">
                      ⚠ {passwordErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">
                    Password must contain:
                  </p>
                  <div className="space-y-1.5">
                    {[
                      {
                        test: passwordForm.newPassword.length >= 8,
                        label: "At least 8 characters",
                      },
                      {
                        test: /[A-Z]/.test(passwordForm.newPassword),
                        label: "One uppercase letter (A-Z)",
                      },
                      {
                        test: /[a-z]/.test(passwordForm.newPassword),
                        label: "One lowercase letter (a-z)",
                      },
                      {
                        test: /\d/.test(passwordForm.newPassword),
                        label: "One number (0-9)",
                      },
                      {
                        test: /[@$!%*?&]/.test(passwordForm.newPassword),
                        label: "One special character (@$!%*?&)",
                      },
                    ].map((req, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${req.test ? "bg-green-500" : "bg-gray-200"}`}
                        >
                          {req.test && (
                            <FiCheck className="text-white text-xs" />
                          )}
                        </div>
                        <span
                          className={`text-xs ${req.test ? "text-green-600" : "text-gray-400"}`}
                        >
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSavePassword}
                  disabled={
                    loading ||
                    !!passwordErrors.newPassword ||
                    !!passwordErrors.confirmPassword ||
                    !passwordForm.newPassword ||
                    !passwordForm.confirmPassword
                  }
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#E91E8C] to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiLock />
                  )}
                  Update Password
                </button>
              </div>
            )}

            {/* ===== ALERTS TAB ===== */}
            {activeTab === "notifications" && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <p className="text-blue-700 font-semibold text-sm mb-1">
                    📢 Alert Settings
                  </p>
                  <p className="text-blue-600 text-xs leading-relaxed">
                    Toggle to control how emergency alerts are sent. Changes
                    save instantly.
                  </p>
                </div>
                {[
                  {
                    key: "emailAlerts",
                    icon: "📧",
                    title: "Email Alerts",
                    desc: "When OFF — no emails sent to contacts during alert",
                    bg: "bg-blue-50",
                  },
                  {
                    key: "whatsappAlerts",
                    icon: "📱",
                    title: "WhatsApp Alerts",
                    desc: "When OFF — no WhatsApp messages sent during alert",
                    bg: "bg-green-50",
                  },
                  {
                    key: "crimeZoneAlerts",
                    icon: "⚠️",
                    title: "Crime Zone Warnings",
                    desc: "Get notified when entering high-risk areas (coming soon)",
                    bg: "bg-orange-50",
                  },
                  {
                    key: "communityAlerts",
                    icon: "🤝",
                    title: "Community Alerts",
                    desc: "When ON — nearby users also notified in your emergency",
                    bg: "bg-purple-50",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 gap-4"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center text-lg flex-shrink-0`}
                      >
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#1A1A2E] text-sm">
                          {item.title}
                        </p>
                        <p className="text-gray-400 text-xs leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <Toggle
                      enabled={notifications[item.key]}
                      onToggle={() => handleToggleNotification(item.key)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* ===== PRIVACY TAB ===== */}
            {activeTab === "privacy" && (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                  <p className="text-purple-700 font-semibold text-sm mb-1">
                    🔐 Privacy Controls
                  </p>
                  <p className="text-purple-600 text-xs leading-relaxed">
                    Control who receives your alerts. Changes save instantly.
                  </p>
                </div>
                {[
                  {
                    key: "shareLocationFamily",
                    icon: "👨‍👩‍👧",
                    title: "Share with Emergency Contacts",
                    desc: "When ON — your contacts receive real-time location & emergency alerts",
                    bg: "bg-pink-50",
                  },
                  {
                    key: "shareLocationCommunity",
                    icon: "🌍",
                    title: "Share with SafeGuard Community",
                    desc: "When ON — all registered SafeGuard users get community emergency notification",
                    bg: "bg-blue-50",
                  },
                  {
                    key: "anonymousMode",
                    icon: "🕵️",
                    title: "Anonymous Mode",
                    desc: "When ON — your name is hidden in community alerts, only location shared",
                    bg: "bg-gray-50",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 gap-4"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center text-lg flex-shrink-0`}
                      >
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#1A1A2E] text-sm">
                          {item.title}
                        </p>
                        <p className="text-gray-400 text-xs leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <Toggle
                      enabled={privacy[item.key]}
                      onToggle={() => handleTogglePrivacy(item.key)}
                    />
                  </div>
                ))}
                <div className="p-4 bg-green-50 border border-green-100 rounded-2xl">
                  <p className="text-green-700 text-sm font-semibold mb-1">
                    🔒 Your Data is Safe
                  </p>
                  <p className="text-green-600 text-xs leading-relaxed">
                    SafeGuard only uses your location for safety. We never sell
                    data. Everything is encrypted.
                  </p>
                </div>
              </div>
            )}

            {/* ===== DANGER ZONE ===== */}
            {activeTab === "danger" && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                  <p className="text-red-700 font-bold text-sm mb-1">
                    ⚠️ Danger Zone
                  </p>
                  <p className="text-red-500 text-xs">
                    Permanent actions. Confirmation required for each.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                  <div>
                    <p className="font-semibold text-[#1A1A2E] text-sm flex items-center gap-2">
                      <FiLogOut className="text-orange-500" /> Logout All
                      Devices
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Sign out from all active sessions
                    </p>
                  </div>
                  <button
                    onClick={handleLogoutAll}
                    className="px-5 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 w-full sm:w-auto"
                  >
                    Logout All
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                  <div>
                    <p className="font-semibold text-[#1A1A2E] text-sm flex items-center gap-2">
                      <FiBell className="text-red-400" /> Clear Alert History
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Permanently delete all emergency alerts from DB
                    </p>
                  </div>
                  <button
                    onClick={handleClearHistory}
                    className="px-5 py-2.5 bg-red-100 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-200 w-full sm:w-auto"
                  >
                    Clear History
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-red-50 border border-red-300 rounded-2xl">
                  <div>
                    <p className="font-bold text-red-700 text-sm flex items-center gap-2">
                      <FiTrash2 /> Delete Account
                    </p>
                    <p className="text-red-400 text-xs mt-0.5">
                      Permanently delete account, alerts, locations, contacts
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 w-full sm:w-auto"
                  >
                    <FiTrash2 /> Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmColor={confirmModal.confirmColor}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />
    </DashboardLayout>
  );
};

export default Settings;
