import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  FiAlertCircle,
  FiUsers,
  FiMapPin,
  FiShield,
  FiEye,
  FiCheck,
  FiX,
  FiNavigation,
} from "react-icons/fi";
import {
  MdLocationOn,
  MdNotifications,
  MdPeople,
  MdWarning,
  MdLocalPolice,
} from "react-icons/md";
import { BsShieldFillCheck } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useTracking } from "../../context/TrackingContext";
import { triggerEmergencyAlert } from "../../services/alertService";
import { fetchAlertHistory } from "../../services/alertService";
import { fetchContacts } from "../../services/contactService";
import {
  fetchUnseenNearbyAlerts,
  markNearbyAlertAsSeen,
  submitHelperAction,
} from "../../services/alertService";
import PWAInstallPrompt from "../../components/PWAInstallPrompt";
import AnalyticsWidget from "../../components/AnalyticsWidget";
import {
  getPendingRequests,
  respondToLinkRequest,
} from "../../services/authService";
import toast from "react-hot-toast";

// ✅ localStorage keys
const HELPER_ACTIONS_KEY = "safeguard_helper_actions";
const SOS_START_TIME_KEY = "safeguard_sos_start_time";
const SOS_STATE_KEY = "safeguard_sos_state";

const quickActions = [
  {
    icon: <MdLocationOn className="text-2xl" />,
    label: "Share My Location",
    description: "Send live location to contacts",
    color: "from-blue-400 to-blue-600",
    path: "/location",
  },
  {
    icon: <MdPeople className="text-2xl" />,
    label: "Manage Contacts",
    description: "Add or edit emergency contacts",
    color: "from-purple-400 to-purple-600",
    path: "/contacts",
  },
  {
    icon: <MdNotifications className="text-2xl" />,
    label: "View Alerts",
    description: "Check your alert history",
    color: "from-orange-400 to-orange-600",
    path: "/alerts",
  },
  {
    icon: <MdLocalPolice className="text-2xl" />,
    label: "Police Stations",
    description: "Find nearest police stations",
    color: "from-blue-600 to-blue-800",
    path: "/police-stations",
  },
];

const Dashboard = () => {
  const { user } = useAuth();
  const {
    socket,
    nearbyAlerts,
    removeNearbyAlertFromDashboard,
    setInitialNearbyAlerts,
  } = useSocket();
  const { tracking, position } = useTracking();
  const navigate = useNavigate();

  // ✅ SOS States
  const [sosState, setSosState] = useState("idle");
  const [countdown, setCountdown] = useState(5);
  const countdownRef = useRef(null);
  const locationRef = useRef(null);
  const sendingRef = useRef(false); // ✅ prevent double send

  // ✅ Stats
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [contactsCount, setContactsCount] = useState(0);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [allAlerts, setAllAlerts] = useState([]);

  // ✅ Link requests
  const [pendingRequests, setPendingRequests] = useState([]);
  const [respondingId, setRespondingId] = useState(null);

  // ✅ Nearby alerts
  const [nearbyAlertsLoading, setNearbyAlertsLoading] = useState(true);
  const [respondingNearbyId, setRespondingNearbyId] = useState(null);

  // ✅ Helper actions persisted in localStorage
  const [myHelperActions, setMyHelperActions] = useState(() => {
    try {
      const saved = localStorage.getItem(HELPER_ACTIONS_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      return parsed.filter(
        (a) => new Date(a.timestamp || 0).getTime() > cutoff,
      );
    } catch {
      return [];
    }
  });

  // ✅ Save helper actions to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(HELPER_ACTIONS_KEY, JSON.stringify(myHelperActions));
    } catch {
      // ignore
    }
  }, [myHelperActions]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // ============================================
  // ✅ LOAD STATS FROM DB
  // ============================================
  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true);
      try {
        const [alertRes, contactRes] = await Promise.all([
          fetchAlertHistory(),
          fetchContacts(),
        ]);
        setTotalAlerts(alertRes.count || 0);
        setAllAlerts(alertRes.alerts || []);
        setRecentAlerts((alertRes.alerts || []).slice(0, 3));
        setContactsCount((contactRes.contacts || []).length);
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };
    loadStats();
  }, []);

  // ============================================
  // ✅ LOAD UNSEEN NEARBY ALERTS
  // ============================================
  useEffect(() => {
    const loadNearbyAlerts = async () => {
      setNearbyAlertsLoading(true);
      try {
        const response = await fetchUnseenNearbyAlerts();
        const dbAlerts = (response.alerts || []).map((a) => ({
          nearbyAlertId: a._id,
          alertId: a.alertId,
          victimGender: a.victimGender,
          distance: a.distance,
          areaName: a.areaName,
          alertType: a.alertType,
          isExactLocation: a.isExactLocation,
          victimName: a.victimName,
          exactLocation: a.exactLocation,
          timestamp: a.createdAt,
        }));
        setInitialNearbyAlerts(dbAlerts);
      } catch (error) {
        console.error("Failed to load nearby alerts:", error);
      } finally {
        setNearbyAlertsLoading(false);
      }
    };
    loadNearbyAlerts();
  }, []);

  // ============================================
  // ✅ LOAD PENDING REQUESTS
  // ============================================
  useEffect(() => {
    const loadRequests = async () => {
      try {
        const response = await getPendingRequests();
        setPendingRequests(response.requests || []);
      } catch {
        console.error("Failed to load requests");
      }
    };
    loadRequests();
  }, []);

  // ============================================
  // ✅ PERSISTENT SOS — CHECK ON MOUNT
  // This is the KEY FEATURE:
  // When page loads or refreshes, we check if
  // an SOS countdown was in progress.
  // If yes → resume it from remaining time.
  // If countdown already expired → send immediately.
  // ============================================
  useEffect(() => {
    const savedState = localStorage.getItem(SOS_STATE_KEY);
    const startTime = localStorage.getItem(SOS_START_TIME_KEY);

    if (savedState === "countdown" && startTime) {
      const elapsed = Math.floor((Date.now() - parseInt(startTime)) / 1000);
      const remaining = 5 - elapsed;

      if (remaining > 0) {
        // ✅ Resume countdown from remaining time
        console.log(`📍 Resuming SOS countdown: ${remaining}s remaining`);
        setSosState("countdown");
        setCountdown(remaining);

        // Get location in background
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              locationRef.current = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              };
            },
            () => {
              locationRef.current = null;
            },
          );
        }

        // ✅ Start countdown from remaining value
        startCountdown(remaining);
      } else if (remaining <= 0 && !sendingRef.current) {
        // ✅ Countdown already expired during page change
        // Send alert immediately
        console.log("📍 SOS countdown expired during navigation - sending now");
        setSosState("sending");
        sendAlert();
      }
    } else if (savedState === "sending") {
      // ✅ Was sending when page changed - resume sending state
      if (!sendingRef.current) {
        setSosState("sending");
        sendAlert();
      }
    }

    // ✅ Cleanup on unmount
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // ============================================
  // ✅ START COUNTDOWN FUNCTION
  // Extracted to be reusable (for resume + fresh start)
  // ============================================
  const startCountdown = (startFrom = 5) => {
    // Clear any existing interval
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    let count = startFrom;

    countdownRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);

      if (count <= 0) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
        sendAlert();
      }
    }, 1000);
  };

  // ============================================
  // ✅ HANDLE SOS BUTTON PRESS
  // ============================================
  const handleSOSPress = () => {
    if (sosState !== "idle") return;

    // ✅ Save to localStorage FIRST
    // So even if page refreshes immediately, it's saved
    localStorage.setItem(SOS_STATE_KEY, "countdown");
    localStorage.setItem(SOS_START_TIME_KEY, Date.now().toString());

    setSosState("countdown");
    setCountdown(5);

    // ✅ Get location in background
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          locationRef.current = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
        },
        () => {
          locationRef.current = null;
        },
      );
    }

    // ✅ Start the countdown
    startCountdown(5);
  };

  // ============================================
  // ✅ HANDLE CANCEL
  // ONLY this function should stop the SOS
  // Page change and refresh should NOT stop it
  // ============================================
  const handleCancel = () => {
    // ✅ Clear the interval
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    // ✅ Clear localStorage — this is what makes cancel permanent
    localStorage.removeItem(SOS_STATE_KEY);
    localStorage.removeItem(SOS_START_TIME_KEY);

    // ✅ Reset state
    setSosState("idle");
    setCountdown(5);
    locationRef.current = null;
    sendingRef.current = false;

    toast("Emergency alert cancelled", { icon: "❌" });
  };

  // ============================================
  // ✅ SEND ALERT
  // ============================================
  const sendAlert = async () => {
    // ✅ Prevent double sending
    if (sendingRef.current) return;
    sendingRef.current = true;

    // ✅ Update localStorage state to "sending"
    localStorage.setItem(SOS_STATE_KEY, "sending");

    setSosState("sending");

    try {
      const locationData =
        locationRef.current ||
        (position ? { latitude: position[0], longitude: position[1] } : {});

      const response = await triggerEmergencyAlert({
        latitude: locationData.latitude || null,
        longitude: locationData.longitude || null,
        type: "Panic Button",
      });

      // ✅ Clear localStorage on success
      localStorage.removeItem(SOS_STATE_KEY);
      localStorage.removeItem(SOS_START_TIME_KEY);

      setSosState("sent");
      setTotalAlerts((prev) => prev + 1);
      sendingRef.current = false;

      const nearbyCount = response.alert?.nearbyUsersNotified || 0;
      toast.success(
        `✅ Alert sent! 📱 WhatsApp: ${response.alert?.whatsappSentCount || 0} | 📧 Email: ${response.alert?.emailSentCount || 0}${nearbyCount > 0 ? ` | 👥 Nearby: ${nearbyCount}` : ""}`,
        { duration: 6000 },
      );

      setTimeout(() => {
        setSosState("idle");
        setCountdown(5);
      }, 5000);
    } catch (error) {
      // ✅ Clear localStorage on failure too
      localStorage.removeItem(SOS_STATE_KEY);
      localStorage.removeItem(SOS_START_TIME_KEY);

      toast.error("Failed to send alert. Please try again!");
      setSosState("idle");
      setCountdown(5);
      sendingRef.current = false;
    }
  };

  // ============================================
  // ✅ AUTO SOS FROM URL PARAM
  // ============================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sos") === "true") {
      window.history.replaceState({}, "", "/dashboard");
      toast("🆘 Emergency SOS activated via shortcut", {
        icon: "🚨",
        duration: 3000,
      });
      setTimeout(() => {
        if (sosState === "idle") handleSOSPress();
      }, 1500);
    }
  }, []);

  // ============================================
  // ✅ SOCKET LISTENERS
  // ============================================
  useEffect(() => {
    if (!socket) return;

    const userId = user?.id || user?._id;
    if (userId) {
      socket.emit("join_room", userId.toString());
    }

    // Link request
    socket.on("link_request", (data) => {
      setPendingRequests((prev) => [
        {
          _id: data.requestId,
          fromUserName: data.fromUserName,
          fromUserEmail: data.fromUserEmail,
          relation: data.relation,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      toast(`📩 ${data.fromUserName} wants to monitor you`, {
        duration: 8000,
        icon: "🔔",
      });
    });

    // Helper action - with duplicate check
    socket.on("helper_action", (data) => {
      setMyHelperActions((prev) => {
        // ✅ Strict duplicate check
        const isDuplicate = prev.some(
          (a) =>
            (a.helperActionId &&
              data.helperActionId &&
              a.helperActionId?.toString() ===
                data.helperActionId?.toString()) ||
            (a.helperId?.toString() === data.helperId?.toString() &&
              a.action === data.action &&
              a.alertId?.toString() === data.alertId?.toString()),
        );
        if (isDuplicate) return prev;

        return [{ ...data, timestamp: new Date().toISOString() }, ...prev];
      });

      if (data.action === "called_police") {
        toast.success(`🚔 Someone nearby called police for your help!`, {
          duration: 8000,
        });
      } else if (data.action === "going_to_help") {
        toast.success(
          `🏃 ${data.helperName || "Someone"} is coming to help you!`,
          { duration: 8000 },
        );
      }
    });

    return () => {
      socket.off("link_request");
      socket.off("helper_action");
    };
  }, [socket, user]);

  // ============================================
  // ✅ RESPOND TO LINK REQUEST
  // ============================================
  const handleRespondRequest = async (requestId, action) => {
    setRespondingId(requestId);
    try {
      await respondToLinkRequest({ requestId, action });
      setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
      toast.success(
        action === "accepted" ? "✅ Request accepted." : "❌ Request denied.",
      );
    } catch {
      toast.error("Failed to respond");
    } finally {
      setRespondingId(null);
    }
  };

  // ============================================
  // ✅ MARK NEARBY ALERT AS SEEN
  // ============================================
  const handleMarkNearbyAlertSeen = async (nearbyAlertId) => {
    setRespondingNearbyId(nearbyAlertId);
    try {
      await markNearbyAlertAsSeen(nearbyAlertId);
      removeNearbyAlertFromDashboard(nearbyAlertId);
      toast.success("Marked as seen");
    } catch {
      toast.error("Failed to mark as seen");
    } finally {
      setRespondingNearbyId(null);
    }
  };

  // ============================================
  // ✅ HELPER ACTION FROM NEARBY ALERT
  // ============================================
  const handleHelperAction = async (nearbyAlertId, action) => {
    setRespondingNearbyId(nearbyAlertId);
    try {
      await submitHelperAction({ nearbyAlertId, action });
      removeNearbyAlertFromDashboard(nearbyAlertId);
      if (action === "called_police") {
        toast.success("🚔 Police called! Victim notified.", {
          duration: 6000,
        });
      } else {
        toast.success("🏃 Going to help! Victim notified.", {
          duration: 6000,
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to take action");
    } finally {
      setRespondingNearbyId(null);
    }
  };

  // ============================================
  // ✅ DAYS PROTECTED
  // ============================================
  const getDaysProtected = () => {
    if (!user?.createdAt) return 1;
    const diff = Date.now() - new Date(user.createdAt).getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  // ============================================
  // ✅ DISMISS HELPER ACTIONS
  // ============================================
  const dismissHelperAction = (index) => {
    setMyHelperActions((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      localStorage.setItem(HELPER_ACTIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const dismissAllHelperActions = () => {
    setMyHelperActions([]);
    localStorage.removeItem(HELPER_ACTIONS_KEY);
  };

  // ============================================
  // ✅ GENDER DISPLAY
  // ============================================
  const getGenderDisplay = (gender) => {
    switch (gender) {
      case "Female":
        return { label: "A woman", emoji: "👩" };
      case "Male":
        return { label: "A man", emoji: "👨" };
      default:
        return { label: "Someone", emoji: "🧑" };
    }
  };

  // ============================================
  // ✅ STATS DATA
  // ============================================
  const statsData = [
    {
      icon: <FiAlertCircle className="text-2xl" />,
      label: "Total Alerts",
      value: statsLoading ? "..." : totalAlerts.toString(),
      color: "text-red-500",
      bg: "bg-red-50",
      border: "border-red-100",
      change: totalAlerts === 0 ? "No alerts yet" : `${totalAlerts} triggered`,
      changeColor: totalAlerts === 0 ? "text-gray-400" : "text-red-500",
    },
    {
      icon: <FiUsers className="text-2xl" />,
      label: "Emergency Contacts",
      value: statsLoading ? "..." : contactsCount.toString(),
      color: "text-blue-500",
      bg: "bg-blue-50",
      border: "border-blue-100",
      change: contactsCount === 0 ? "Add contacts" : "All active",
      changeColor: contactsCount === 0 ? "text-orange-400" : "text-green-500",
    },
    {
      icon: <FiMapPin className="text-2xl" />,
      label: "Location Status",
      value: tracking ? "Live" : "Off",
      color: tracking ? "text-green-500" : "text-gray-400",
      bg: tracking ? "bg-green-50" : "bg-gray-50",
      border: tracking ? "border-green-100" : "border-gray-100",
      change: tracking ? "Tracking active" : "Not tracking",
      changeColor: tracking ? "text-green-500" : "text-gray-400",
    },
    {
      icon: <FiShield className="text-2xl" />,
      label: "Days Protected",
      value: getDaysProtected().toString(),
      color: "text-purple-500",
      bg: "bg-purple-50",
      border: "border-purple-100",
      change: "Since registration",
      changeColor: "text-gray-400",
    },
  ];

  // ============================================
  // ✅ SOS CONFIG
  // ============================================
  const getSOSConfig = () => {
    switch (sosState) {
      case "idle":
        return {
          text: "EMERGENCY",
          subText: "Press for help",
          emoji: "🆘",
          bgClass: "from-red-500 to-red-700",
          pulsing: true,
          disabled: false,
        };
      case "countdown":
        return {
          text: countdown.toString(),
          subText: "Sending in...",
          emoji: "⏱",
          bgClass: "from-orange-500 to-orange-700",
          pulsing: false,
          disabled: false,
        };
      case "sending":
        return {
          text: "...",
          subText: "Sending alert",
          emoji: "📡",
          bgClass: "from-yellow-500 to-yellow-700",
          pulsing: false,
          disabled: true,
        };
      case "sent":
        return {
          text: "SENT",
          subText: "Help is coming",
          emoji: "✅",
          bgClass: "from-green-500 to-green-700",
          pulsing: false,
          disabled: true,
        };
      default:
        return {};
    }
  };

  const sosConfig = getSOSConfig();

  return (
    <DashboardLayout>
      <PWAInstallPrompt />
      <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        {/* ── Welcome Banner ── */}
        <div className="bg-gradient-to-r from-[#1A1A2E] to-[#0F3460] rounded-2xl p-4 sm:p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-pink-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-36 sm:w-48 h-36 sm:h-48 bg-purple-500/10 rounded-full blur-2xl" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 sm:gap-6">
            {/* Left */}
            <div className="text-center sm:text-left w-full sm:w-auto">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm font-medium">
                  System Active
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">
                {getGreeting()},{" "}
                <span className="text-[#E91E8C]">
                  {user?.fullName?.split(" ")[0] || "User"} 👋
                </span>
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm">
                Your safety network is active and monitoring. Stay safe!
              </p>
              <div className="mt-3 sm:mt-4 flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
                  <BsShieldFillCheck className="text-green-400 text-sm" />
                  <span className="text-green-400 text-xs sm:text-sm font-semibold">
                    YOU ARE SAFE ✓
                  </span>
                </div>
                {tracking && (
                  <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-3 py-1.5">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    <span className="text-blue-400 text-xs font-semibold">
                      TRACKING LIVE
                    </span>
                  </div>
                )}
              </div>

              {/* ✅ SOS Active indicator - shows on other pages too */}
              {sosState === "countdown" && (
                <div className="mt-3 flex items-center justify-center sm:justify-start gap-2 bg-orange-500/20 border border-orange-500/40 rounded-full px-4 py-2 w-fit">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-ping" />
                  <span className="text-orange-300 text-xs font-bold">
                    SOS SENDING IN {countdown}s — SCROLL DOWN TO CANCEL
                  </span>
                </div>
              )}
            </div>

            {/* ✅ SOS Button */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <button
                onClick={sosState === "idle" ? handleSOSPress : undefined}
                disabled={sosConfig.disabled}
                className={`
                  relative flex flex-col items-center justify-center
                  w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36
                  rounded-full font-bold text-white
                  transition-all duration-300 shadow-2xl
                  bg-gradient-to-br ${sosConfig.bgClass}
                  ${sosConfig.pulsing ? "animate-pulse" : ""}
                  ${
                    sosConfig.disabled
                      ? "cursor-not-allowed opacity-90"
                      : sosState === "idle"
                        ? "hover:scale-110 cursor-pointer"
                        : "cursor-default"
                  }
                `}
              >
                {/* Ping ring when idle */}
                {sosState === "idle" && (
                  <div className="absolute inset-0 rounded-full border-4 border-red-400/40 animate-ping" />
                )}

                {/* ✅ Countdown ring */}
                {sosState === "countdown" && (
                  <svg
                    className="absolute inset-0 w-full h-full -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      fill="none"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      fill="none"
                      stroke="white"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 46}`}
                      strokeDashoffset={`${2 * Math.PI * 46 * (1 - countdown / 5)}`}
                      style={{ transition: "stroke-dashoffset 1s linear" }}
                    />
                  </svg>
                )}

                {/* Spinner when sending */}
                {sosState === "sending" && (
                  <div className="absolute inset-2 rounded-full border-4 border-white/20 border-t-white animate-spin" />
                )}

                <span className="text-2xl sm:text-3xl mb-0.5 relative z-10">
                  {sosConfig.emoji}
                </span>
                <span className="text-xs sm:text-sm font-bold tracking-wider relative z-10 px-1 text-center leading-tight">
                  {sosConfig.text}
                </span>
              </button>

              <p
                className={`text-xs font-medium text-center ${
                  sosState === "countdown"
                    ? "text-orange-300"
                    : sosState === "sending"
                      ? "text-yellow-300"
                      : sosState === "sent"
                        ? "text-green-300"
                        : "text-gray-400"
                }`}
              >
                {sosConfig.subText}
              </p>

              {/* ✅ Cancel button - ONLY way to stop SOS */}
              {sosState === "countdown" && (
                <button
                  onClick={handleCancel}
                  className="mt-1 px-5 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-full transition-all border border-white/40 backdrop-blur-sm animate-pulse"
                >
                  ✕ Cancel SOS
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ✅ Persistent SOS Banner - shows on every page during countdown */}
        {sosState === "countdown" && (
          <div className="bg-orange-500 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-2xl animate-bounce flex-shrink-0">
                ⏱
              </div>
              <div>
                <p className="text-white font-bold text-sm sm:text-base">
                  SOS Alert sending in {countdown} seconds...
                </p>
                <p className="text-orange-100 text-xs">
                  This will send to all your emergency contacts. Page change
                  will NOT cancel this.
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="flex-shrink-0 px-4 py-2 bg-white text-orange-500 text-xs font-bold rounded-xl hover:bg-orange-50 transition-colors"
            >
              ✕ Cancel
            </button>
          </div>
        )}

        {/* ── Sending Banner ── */}
        {sosState === "sending" && (
          <div className="bg-yellow-500 rounded-2xl p-3 sm:p-4 flex items-center gap-3">
            <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
            <div>
              <p className="text-white font-bold text-sm sm:text-base">
                Sending emergency alerts...
              </p>
              <p className="text-yellow-100 text-xs">
                Please wait. Do not press again.
              </p>
            </div>
          </div>
        )}

        {/* ── Sent Banner ── */}
        {sosState === "sent" && (
          <div className="bg-green-500 rounded-2xl p-3 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-xl flex-shrink-0">
              ✅
            </div>
            <div>
              <p className="text-white font-bold text-sm sm:text-base">
                Emergency alert sent successfully!
              </p>
              <p className="text-green-100 text-xs">
                Help is on the way. Stay calm and stay safe.
              </p>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* ✅ Helper Actions Banner - persists on refresh*/}
        {/* ============================================ */}
        {myHelperActions.length > 0 && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                🤝
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm sm:text-base">
                  People responded to your SOS!
                </p>
                <p className="text-blue-100 text-xs">
                  {myHelperActions.length} person(s) are helping you
                </p>
              </div>
              <button
                onClick={dismissAllHelperActions}
                className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-colors flex-shrink-0"
              >
                <FiX className="text-sm" />
              </button>
            </div>

            <div className="space-y-2">
              {myHelperActions.map((action, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between bg-white/10 rounded-xl p-3"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="text-2xl flex-shrink-0">
                      {action.action === "called_police" ? "🚔" : "🏃"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">
                        {action.action === "called_police"
                          ? "Police Called for You"
                          : "Someone is Coming to Help"}
                      </p>
                      <p className="text-blue-200 text-xs mt-0.5">
                        {action.helperName || "A nearby SafeGuard user"}
                        {" • "}
                        {action.action === "called_police"
                          ? "Called 100/112 on your behalf"
                          : "On their way to your location"}
                      </p>
                      {action.action === "going_to_help" && (
                        <p className="text-blue-200 text-xs mt-1">
                          📍 Coming from nearby area
                          {action.helperGender === "Female"
                            ? " • A woman is helping you"
                            : action.helperGender === "Male"
                              ? " • A man is helping you"
                              : ""}
                        </p>
                      )}
                      {action.action === "called_police" && (
                        <p className="text-blue-200 text-xs mt-1">
                          🚔 Emergency services have been contacted
                        </p>
                      )}
                      <p className="text-blue-300 text-xs mt-1">
                        🕐{" "}
                        {action.timestamp
                          ? new Date(action.timestamp).toLocaleTimeString(
                              "en-IN",
                              { hour: "2-digit", minute: "2-digit" },
                            )
                          : "Just now"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissHelperAction(index)}
                    className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-colors flex-shrink-0 ml-2"
                  >
                    <FiX className="text-xs" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-blue-100 text-xs text-center">
                🆘 Stay where you are • Help is coming • Call 112 if needed
              </p>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* ✅ Nearby Emergency Alerts Banner            */}
        {/* ============================================ */}
        {!nearbyAlertsLoading && nearbyAlerts.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-orange-300 p-4 sm:p-5 shadow-sm">
            <h3 className="font-bold text-[#1A1A2E] mb-3 flex items-center gap-2 text-sm sm:text-base">
              <span className="text-2xl animate-bounce">🆘</span>
              Nearby Emergency Alerts
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {nearbyAlerts.length}
              </span>
            </h3>

            <div className="space-y-3">
              {nearbyAlerts.map((alert) => {
                const genderInfo = getGenderDisplay(alert.victimGender);
                const isResponding =
                  respondingNearbyId === alert.nearbyAlertId?.toString();

                return (
                  <div
                    key={alert.nearbyAlertId}
                    className="bg-orange-50 border border-orange-200 rounded-2xl p-4"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                        {genderInfo.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1A1A2E] text-sm">
                          {alert.isExactLocation && alert.victimName
                            ? `${alert.victimName} needs help!`
                            : `${genderInfo.label} needs help nearby!`}
                        </p>
                        <p className="text-orange-700 text-xs font-semibold mt-0.5">
                          {alert.alertType}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                            📍 {alert.distance} km away
                          </span>
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                            📌 {alert.areaName}
                          </span>
                        </div>
                        {alert.isExactLocation &&
                          alert.exactLocation?.address && (
                            <p className="text-gray-600 text-xs mt-1 leading-relaxed">
                              📍 {alert.exactLocation.address}
                            </p>
                          )}
                        <p className="text-gray-400 text-xs mt-1">
                          🕐{" "}
                          {alert.timestamp
                            ? new Date(alert.timestamp).toLocaleTimeString(
                                "en-IN",
                                { hour: "2-digit", minute: "2-digit" },
                              )
                            : "Just now"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() =>
                          handleHelperAction(
                            alert.nearbyAlertId,
                            "called_police",
                          )
                        }
                        disabled={isResponding}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white text-xs font-bold rounded-xl hover:bg-blue-600 disabled:opacity-60 transition-colors"
                      >
                        {isResponding ? (
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          "🚔"
                        )}
                        Called Police
                      </button>

                      <button
                        onClick={() =>
                          handleHelperAction(
                            alert.nearbyAlertId,
                            "going_to_help",
                          )
                        }
                        disabled={isResponding}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-600 disabled:opacity-60 transition-colors"
                      >
                        {isResponding ? (
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <FiNavigation className="text-sm" />
                        )}
                        Going to Help
                      </button>

                      {alert.isExactLocation &&
                        alert.exactLocation?.mapsLink && (
                          <a
                            href={alert.exactLocation.mapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 bg-purple-500 text-white text-xs font-bold rounded-xl hover:bg-purple-600 transition-colors"
                          >
                            <MdLocationOn className="text-sm" />
                            View Map
                          </a>
                        )}

                      {!alert.isExactLocation && (
                        <Link
                          to={`/alerts?nearby=${alert.nearbyAlertId}`}
                          className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                          <MdLocationOn className="text-sm" />
                          Area Map
                        </Link>
                      )}

                      <button
                        onClick={() =>
                          handleMarkNearbyAlertSeen(alert.nearbyAlertId)
                        }
                        disabled={isResponding}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 disabled:opacity-60 transition-colors ml-auto"
                      >
                        <FiEye className="text-sm" />
                        Seen
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-gray-400 text-xs mt-3 text-center">
              Auto-expire in 24 hours • Saved in your Alert History
            </p>
          </div>
        )}

        {/* ============================================ */}
        {/* ✅ Pending Link Requests                     */}
        {/* ============================================ */}
        {pendingRequests.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-blue-200 p-4 sm:p-5 shadow-sm">
            <h3 className="font-bold text-[#1A1A2E] mb-3 flex items-center gap-2 text-sm sm:text-base">
              📩 Monitoring Requests
              <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            </h3>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req._id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4"
                >
                  <div>
                    <p className="font-semibold text-[#1A1A2E] text-sm">
                      <strong>{req.fromUserName}</strong>
                    </p>
                    <p className="text-gray-500 text-xs">{req.fromUserEmail}</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Wants to monitor you as:{" "}
                      <strong className="text-[#1A1A2E]">{req.relation}</strong>
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleRespondRequest(req._id, "accepted")}
                      disabled={respondingId === req._id}
                      className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-600 transition-colors disabled:opacity-60"
                    >
                      {respondingId === req._id ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <FiCheck />
                      )}
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespondRequest(req._id, "denied")}
                      disabled={respondingId === req._id}
                      className="flex items-center gap-1 px-4 py-2 bg-red-100 text-red-600 text-xs font-bold rounded-xl hover:bg-red-200 transition-colors disabled:opacity-60"
                    >
                      <FiX /> Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statsData.map((stat, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl p-4 sm:p-5 border ${stat.border} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
            >
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.bg} rounded-xl flex items-center justify-center mb-3 sm:mb-4`}
              >
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#1A1A2E] mb-1">
                {stat.value}
              </div>
              <div className="text-gray-500 text-xs mb-1 sm:mb-2">
                {stat.label}
              </div>
              <div className={`text-xs font-medium ${stat.changeColor}`}>
                {stat.change}
              </div>
            </div>
          ))}
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#1A1A2E] mb-3 sm:mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.path}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
              >
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center text-white mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}
                >
                  {action.icon}
                </div>
                <h4 className="font-semibold text-[#1A1A2E] text-xs sm:text-sm mb-1 group-hover:text-[#E91E8C] transition-colors">
                  {action.label}
                </h4>
                <p className="text-gray-400 text-xs hidden sm:block">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Bottom Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Alerts */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h3 className="text-base sm:text-lg font-bold text-[#1A1A2E]">
                Recent Alerts
              </h3>
              <Link
                to="/alerts"
                className="text-[#E91E8C] text-sm font-semibold hover:underline flex items-center gap-1"
              >
                View All <FiEye className="text-sm" />
              </Link>
            </div>

            {statsLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-[#E91E8C] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : recentAlerts.length > 0 ? (
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert._id}
                    className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-3"
                  >
                    <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FiAlertCircle className="text-white text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1A1A2E] text-xs">
                        {alert.type}
                      </p>
                      {alert.location?.address && (
                        <p className="text-gray-400 text-xs truncate mt-0.5">
                          📍 {alert.location.address}
                        </p>
                      )}
                      <p className="text-gray-400 text-xs mt-0.5">
                        {new Date(alert.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {alert.nearbyUsersNotified > 0 && (
                        <p className="text-blue-500 text-xs mt-0.5">
                          👥 {alert.nearbyUsersNotified} nearby users notified
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        alert.status === "Sent"
                          ? "bg-green-100 text-green-700"
                          : alert.status === "Partial"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {alert.status}
                    </span>
                  </div>
                ))}
                <Link
                  to="/alerts"
                  className="block text-center text-[#E91E8C] text-sm hover:underline mt-2"
                >
                  View all {totalAlerts} alerts →
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-10">
                <BsShieldFillCheck className="text-4xl sm:text-5xl text-green-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium text-sm">Stay Safe!</p>
                <p className="text-gray-400 text-xs mt-1">
                  No emergency alerts yet
                </p>
              </div>
            )}
          </div>

          {/* Location Preview */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h3 className="text-base sm:text-lg font-bold text-[#1A1A2E]">
                My Location
              </h3>
              <Link
                to="/location"
                className="text-[#E91E8C] text-sm font-semibold hover:underline flex items-center gap-1"
              >
                {tracking ? "View Live Map" : "Start Tracking"}{" "}
                <FiEye className="text-sm" />
              </Link>
            </div>

            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-40 sm:h-52 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="border-b border-gray-400 h-8" />
                ))}
              </div>
              <div className="relative z-10 text-center">
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${
                    tracking
                      ? "from-green-400 to-green-600"
                      : "from-[#E91E8C] to-pink-700"
                  } rounded-full flex items-center justify-center shadow-xl mx-auto mb-2 sm:mb-3 ${
                    tracking ? "" : "animate-bounce"
                  }`}
                >
                  <MdLocationOn className="text-white text-2xl sm:text-3xl" />
                </div>
                <p className="text-gray-600 font-semibold text-xs sm:text-sm">
                  {tracking ? "Live Tracking Active" : "Tracking Not Started"}
                </p>
                {position && (
                  <p className="text-gray-400 text-xs mt-1 font-mono">
                    {position[0].toFixed(4)}°, {position[1].toFixed(4)}°
                  </p>
                )}
                {!tracking && (
                  <p className="text-gray-400 text-xs mt-1">
                    Go to Location page to start
                  </p>
                )}
              </div>
              <div
                className={`absolute top-3 right-3 flex items-center gap-1.5 ${
                  tracking ? "bg-green-500" : "bg-gray-400"
                } text-white text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full`}
              >
                <div
                  className={`w-1.5 h-1.5 bg-white rounded-full ${
                    tracking ? "animate-pulse" : ""
                  }`}
                />
                {tracking ? "LIVE" : "OFF"}
              </div>
            </div>

            <div className="mt-3 sm:mt-4 flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <MdLocationOn className="text-[#E91E8C] text-lg sm:text-xl flex-shrink-0" />
              <div>
                <p className="text-[#1A1A2E] font-semibold text-xs sm:text-sm">
                  {tracking
                    ? `Sharing location • ${position ? "GPS locked" : "Getting GPS..."}`
                    : "Location sharing is off"}
                </p>
                <p className="text-gray-400 text-xs">
                  {tracking
                    ? "Family can see your location"
                    : "Click 'Start Tracking' to share"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Tip */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 rounded-2xl p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#E91E8C] rounded-xl flex items-center justify-center flex-shrink-0">
            <MdWarning className="text-white text-xl sm:text-2xl" />
          </div>
          <div>
            <h4 className="font-bold text-[#1A1A2E] mb-1 text-sm sm:text-base">
              💡 Safety Tip of the Day
            </h4>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Always share your live location with a trusted contact when
              traveling alone at night. Keep your emergency contacts updated and
              make sure they have WhatsApp installed.
            </p>
          </div>
        </div>

        <AnalyticsWidget alerts={allAlerts} />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
