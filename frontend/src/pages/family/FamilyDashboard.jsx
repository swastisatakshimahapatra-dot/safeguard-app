import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import {
  FiUsers,
  FiMapPin,
  FiAlertCircle,
  FiPhone,
  FiWifi,
  FiWifiOff,
  FiPlus,
  FiTrash2,
  FiX,
  FiRefreshCw,
  FiCheck,
} from "react-icons/fi";
import { MdLocationOn, MdSecurity, MdWarning } from "react-icons/md";
import { BsShieldFillCheck } from "react-icons/bs";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import {
  getLinkedUsers,
  sendLinkRequest,
  unlinkUser,
} from "../../services/authService";
import { fetchFamilyAlerts } from "../../services/alertService";
import toast from "react-hot-toast";
import L from "leaflet";
import { formatDistanceToNow, format } from "date-fns";

const MapUpdater = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom());
  }, [position]);
  return null;
};

const createTrackedUserIcon = (name) =>
  L.divIcon({
    className: "",
    html: `
    <div style="display:flex;flex-direction:column;align-items:center;">
      <div style="background:#E91E8C;color:white;font-size:10px;font-weight:700;padding:3px 10px;border-radius:6px;margin-bottom:4px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${name}</div>
      <div style="width:18px;height:18px;background:#E91E8C;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(233,30,140,0.4);"></div>
    </div>`,
    iconSize: [80, 40],
    iconAnchor: [40, 35],
  });

const avatarColors = [
  "from-pink-400 to-pink-600",
  "from-purple-400 to-purple-600",
  "from-blue-400 to-blue-600",
  "from-green-400 to-green-600",
  "from-orange-400 to-orange-600",
];

const relations = [
  "Daughter",
  "Son",
  "Mother",
  "Father",
  "Sibling",
  "Spouse",
  "Friend",
  "Other",
];

// ✅ REMOVED localStorage keys - alerts now come from DB
const DANGER_KEY = "safeguard_danger_users";

const FamilyDashboard = () => {
  const { user } = useAuth();
  const { socket, connected } = useSocket();

  const [linkedUsers, setLinkedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mapPosition, setMapPosition] = useState([20.5937, 78.9629]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  // ✅ Alerts now from DB - no localStorage
  const [alerts, setAlerts] = useState([]);

  // ✅ Keep danger state in localStorage (UI state only)
  const [dangerUsers, setDangerUsers] = useState(() => {
    try {
      const saved = localStorage.getItem(DANGER_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkForm, setLinkForm] = useState({ email: "", relation: "" });
  const [linkLoading, setLinkLoading] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState(null);

  useEffect(() => {
    localStorage.setItem(DANGER_KEY, JSON.stringify(dangerUsers));
  }, [dangerUsers]);

  // ✅ Load family alerts from DB
  const loadFamilyAlerts = async () => {
    setAlertsLoading(true);
    try {
      const response = await fetchFamilyAlerts();
      const dbAlerts = (response.alerts || []).map((a) => ({
        id: a._id,
        userId: a.triggeredBy?.userId,
        userName: a.triggeredBy?.userName,
        type: a.type,
        address: a.location?.address,
        mapsLink: a.location?.available ? a.location?.mapsLink : null,
        latitude: a.location?.available ? a.location?.latitude : null,
        longitude: a.location?.available ? a.location?.longitude : null,
        locationAvailable: a.location?.available || false,
        timestamp: a.createdAt,
      }));
      setAlerts(dbAlerts);
      console.log(`✅ Loaded ${dbAlerts.length} family alerts from DB`);
    } catch (error) {
      console.error("Failed to load family alerts:", error);
      // ✅ Don't show error toast - just use socket data
      setAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  };

  const loadLinkedUsers = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const response = await getLinkedUsers();
      const users = response.linkedUsers || [];
      setLinkedUsers(users);
      if (users.length > 0 && !selectedUser) {
        const withLoc = users.find((u) => u.location);
        const first = withLoc || users[0];
        setSelectedUser(first);
        if (first.location) {
          setMapPosition([first.location.latitude, first.location.longitude]);
        }
      }
    } catch {
      toast.error("Failed to load linked users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLinkedUsers();
    // ✅ Load alerts from DB on mount
    loadFamilyAlerts();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const userId = user?.id || user?._id;
    if (userId) {
      socket.emit("join_room", userId.toString());
    }

    linkedUsers.forEach((u) => {
      socket.emit("watch_user", u.id.toString());
    });

    const handleLinkAccepted = (data) => {
      const newUser = data.user;
      setLinkedUsers((prev) => {
        const exists = prev.some(
          (u) => u.id?.toString() === newUser.id?.toString(),
        );
        if (exists) return prev;
        return [...prev, newUser];
      });
      socket.emit("watch_user", newUser.id.toString());
      setSelectedUser((prev) => {
        if (!prev) {
          if (newUser.location) {
            setMapPosition([
              newUser.location.latitude,
              newUser.location.longitude,
            ]);
          }
          return newUser;
        }
        return prev;
      });
      toast.success(`✅ ${newUser.name} accepted your request!`, {
        duration: 5000,
      });
    };

    const handleLinkDenied = (data) => {
      toast.error(`❌ ${data.userName} denied your monitoring request.`, {
        duration: 5000,
      });
    };

    const handleLocationUpdate = (data) => {
      setLinkedUsers((prev) =>
        prev.map((u) =>
          u.id?.toString() === data.userId?.toString()
            ? {
                ...u,
                location: {
                  ...u.location,
                  latitude: data.latitude,
                  longitude: data.longitude,
                  accuracy: data.accuracy,
                  lastUpdated: new Date().toISOString(),
                },
              }
            : u,
        ),
      );
      setSelectedUser((prev) => {
        if (prev?.id?.toString() === data.userId?.toString()) {
          const updated = {
            ...prev,
            location: {
              ...prev.location,
              latitude: data.latitude,
              longitude: data.longitude,
              lastUpdated: new Date().toISOString(),
            },
          };
          setMapPosition([data.latitude, data.longitude]);
          return updated;
        }
        return prev;
      });
    };

    // ✅ Emergency alert - reload from DB + add to state
    const handleEmergencyAlert = (data) => {
      const sosTime = new Date().toISOString();

      // ✅ Only store real location data
      const hasLocation =
        data.locationAvailable && data.latitude && data.longitude;

      const newAlert = {
        id: data.familyAlertId || `alert_${Date.now()}`,
        userId: data.userId,
        userName: data.userName,
        type: data.type,
        address: data.address,
        // ✅ Never show map button if no location
        mapsLink: hasLocation ? data.mapsLink : null,
        latitude: hasLocation ? data.latitude : null,
        longitude: hasLocation ? data.longitude : null,
        locationAvailable: hasLocation,
        timestamp: sosTime,
      };

      setAlerts((prev) => [newAlert, ...prev].slice(0, 50));

      setDangerUsers((prev) => ({
        ...prev,
        [data.userId?.toString()]: {
          since: sosTime,
          userName: data.userName,
        },
      }));

      setLinkedUsers((prev) =>
        prev.map((u) =>
          u.id?.toString() === data.userId?.toString()
            ? {
                ...u,
                location:
                  u.location && hasLocation
                    ? {
                        ...u.location,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        lastUpdated: sosTime,
                      }
                    : u.location,
              }
            : u,
        ),
      );

      toast.error(`🆘 EMERGENCY! ${data.userName} needs help!`, {
        duration: 10000,
      });
    };

    const handleDangerZoneEntry = (data) => {
      const { userId, zoneName, riskLevel, latitude, longitude, timestamp } =
        data;
      setLinkedUsers((prev) => {
        const foundUser = prev.find(
          (u) => u.id?.toString() === userId?.toString(),
        );
        const userName = foundUser?.name || "User";
        const dangerAlert = {
          id: `danger_${Date.now()}`,
          userId,
          userName,
          type: `Entered ${riskLevel.toUpperCase()} Risk Zone`,
          address: zoneName,
          mapsLink:
            latitude && longitude
              ? `https://maps.google.com/?q=${latitude},${longitude}`
              : null,
          latitude: latitude || null,
          longitude: longitude || null,
          locationAvailable: !!(latitude && longitude),
          timestamp: timestamp || new Date().toISOString(),
        };
        setAlerts((alertsPrev) => [dangerAlert, ...alertsPrev].slice(0, 50));
        setDangerUsers((dangerPrev) => ({
          ...dangerPrev,
          [userId?.toString()]: {
            since: timestamp || new Date().toISOString(),
            userName,
            zoneName,
            riskLevel,
          },
        }));
        toast.error(
          `⚠️ ${userName} entered ${riskLevel} risk zone: ${zoneName}`,
          {
            duration: 10000,
          },
        );
        return prev;
      });
    };

    const handleDangerZoneExit = (data) => {
      const { userId } = data;
      setDangerUsers((prev) => {
        const updated = { ...prev };
        delete updated[userId?.toString()];
        return updated;
      });
      setLinkedUsers((prev) => {
        const foundUser = prev.find(
          (u) => u.id?.toString() === userId?.toString(),
        );
        if (foundUser) {
          toast.success(`✅ ${foundUser.name} exited danger zone`, {
            duration: 4000,
          });
        }
        return prev;
      });
    };

    socket.on("link_request_accepted", handleLinkAccepted);
    socket.on("link_request_denied", handleLinkDenied);
    socket.on("location_update", handleLocationUpdate);
    socket.on("emergency_alert", handleEmergencyAlert);
    socket.on("danger_zone_entry", handleDangerZoneEntry);
    socket.on("danger_zone_exit", handleDangerZoneExit);

    return () => {
      socket.off("link_request_accepted", handleLinkAccepted);
      socket.off("link_request_denied", handleLinkDenied);
      socket.off("location_update", handleLocationUpdate);
      socket.off("emergency_alert", handleEmergencyAlert);
      socket.off("danger_zone_entry", handleDangerZoneEntry);
      socket.off("danger_zone_exit", handleDangerZoneExit);
    };
  }, [socket, user, linkedUsers.length]);

  const handleMarkSafe = (userId) => {
    setDangerUsers((prev) => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
    toast.success("Marked as safe ✅");
  };

  // ✅ Clear alerts - only UI state, DB alerts remain
  const handleClearAlerts = () => {
    setAlerts([]);
    toast.success("Alerts cleared from view (history preserved in DB)");
  };

  const handleUnlink = async (userId) => {
    try {
      await unlinkUser(userId);
      setLinkedUsers((prev) =>
        prev.filter((u) => u.id?.toString() !== userId?.toString()),
      );
      // ✅ Remove alerts from view for this user
      setAlerts((prev) =>
        prev.filter((a) => a.userId?.toString() !== userId?.toString()),
      );
      setDangerUsers((prev) => {
        const updated = { ...prev };
        delete updated[userId?.toString()];
        return updated;
      });
      if (socket) {
        socket.emit("unwatch_user", userId.toString());
      }
      if (selectedUser?.id?.toString() === userId?.toString()) {
        setSelectedUser(null);
        setMapPosition([20.5937, 78.9629]);
      }
      toast.success("User removed");
      setUnlinkTarget(null);
    } catch {
      toast.error("Failed to unlink");
    }
  };

  const getStatusConfig = (u) => {
    const isDanger = !!dangerUsers[u.id?.toString()];
    if (isDanger) {
      return {
        label: "DANGER",
        color: "text-red-600",
        bg: "bg-red-100",
        dot: "bg-red-500",
        animate: "animate-bounce",
      };
    }
    if (!u.location) {
      return {
        label: "Offline",
        color: "text-gray-500",
        bg: "bg-gray-100",
        dot: "bg-gray-400",
        animate: "",
      };
    }
    const lastUpdate = u.location.lastUpdated
      ? new Date(u.location.lastUpdated)
      : null;
    const isRecent =
      lastUpdate && Date.now() - lastUpdate.getTime() < 5 * 60 * 1000;
    if (isRecent) {
      return {
        label: "Live",
        color: "text-green-600",
        bg: "bg-green-100",
        dot: "bg-green-500",
        animate: "animate-pulse",
      };
    }
    return {
      label: "Safe",
      color: "text-blue-600",
      bg: "bg-blue-100",
      dot: "bg-blue-400",
      animate: "",
    };
  };

  const handleSendRequest = async () => {
    if (!linkForm.email.trim()) {
      toast.error("Enter email");
      return;
    }
    if (!linkForm.relation) {
      toast.error("Select relation");
      return;
    }
    setLinkLoading(true);
    try {
      const response = await sendLinkRequest({
        email: linkForm.email.trim(),
        relation: linkForm.relation,
      });
      toast.success(response.message || "Request sent!");
      setShowLinkModal(false);
      setLinkForm({ email: "", relation: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
    } finally {
      setLinkLoading(false);
    }
  };

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    if (u.location) setMapPosition([u.location.latitude, u.location.longitude]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A2E]">
              Family Dashboard
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Monitor your loved ones in real-time
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium ${connected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
            >
              {connected ? <FiWifi /> : <FiWifiOff />}
              {connected ? "Live" : "Offline"}
            </div>
            <button
              onClick={() => {
                loadLinkedUsers(true);
                loadFamilyAlerts();
              }}
              className="flex items-center gap-2 px-3 py-2 border-2 border-gray-200 text-gray-600 rounded-xl hover:border-[#E91E8C] hover:text-[#E91E8C] transition-all text-sm"
            >
              <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setShowLinkModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E91E8C] to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm"
            >
              <FiPlus /> Add Person
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              icon: <FiUsers />,
              label: "Monitored",
              value: linkedUsers.length,
              color: "text-blue-500",
              bg: "bg-blue-50",
              border: "border-blue-100",
            },
            {
              icon: <BsShieldFillCheck />,
              label: "Safe",
              value: linkedUsers.filter(
                (u) => !dangerUsers[u.id?.toString()] && u.location,
              ).length,
              color: "text-green-500",
              bg: "bg-green-50",
              border: "border-green-100",
            },
            {
              icon: <FiAlertCircle />,
              label: "Alerts Today",
              value: alerts.filter(
                (a) =>
                  new Date(a.timestamp).toDateString() ===
                  new Date().toDateString(),
              ).length,
              color: "text-red-500",
              bg: "bg-red-50",
              border: "border-red-100",
            },
            {
              icon: <MdLocationOn />,
              label: "Tracking",
              value: linkedUsers.filter((u) => u.location).length,
              color: "text-purple-500",
              bg: "bg-purple-50",
              border: "border-purple-100",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`bg-white rounded-2xl p-4 sm:p-5 border ${stat.border}`}
            >
              <div
                className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3 text-xl`}
              >
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#1A1A2E]">
                {stat.value}
              </div>
              <div className="text-gray-400 text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Danger Banner */}
        {Object.keys(dangerUsers).length > 0 && (
          <div className="bg-red-500 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-2xl animate-bounce flex-shrink-0">
                🆘
              </div>
              <div>
                <p className="text-white font-bold text-sm sm:text-base">
                  EMERGENCY ALERT ACTIVE
                </p>
                <p className="text-red-100 text-xs">
                  {Object.keys(dangerUsers).length} person(s) need help
                </p>
              </div>
            </div>
            {Object.entries(dangerUsers).map(([uid, info]) => (
              <div
                key={uid}
                className="flex items-center justify-between bg-white/10 rounded-xl p-3 mb-2"
              >
                <div>
                  <p className="text-white font-semibold text-sm">
                    {info.userName}
                  </p>
                  <p className="text-red-200 text-xs">
                    🆘 SOS{" "}
                    {formatDistanceToNow(new Date(info.since), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleMarkSafe(uid)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  <FiCheck /> Mark Safe
                </button>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#E91E8C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading tracked users...</p>
            </div>
          </div>
        ) : linkedUsers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="w-20 h-20 bg-pink-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <FiUsers className="text-4xl text-[#E91E8C]" />
            </div>
            <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">
              No One Linked Yet
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Send a monitoring request to your loved one. They must accept
              before you can see their location.
            </p>
            <button
              onClick={() => setShowLinkModal(true)}
              className="px-8 py-3 bg-gradient-to-r from-[#E91E8C] to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              + Send Monitor Request
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* User List */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-sm font-bold text-[#1A1A2E]">
                Tracked Members ({linkedUsers.length})
              </h3>
              {linkedUsers.map((u, index) => {
                const statusConfig = getStatusConfig(u);
                const isSelected =
                  selectedUser?.id?.toString() === u.id?.toString();
                const isDanger = !!dangerUsers[u.id?.toString()];
                const dangerInfo = dangerUsers[u.id?.toString()];

                return (
                  <div
                    key={u.id}
                    className={`bg-white rounded-2xl p-4 border-2 transition-all ${
                      isDanger
                        ? "border-red-400 shadow-lg shadow-red-100"
                        : isSelected
                          ? "border-[#E91E8C] shadow-md shadow-pink-100"
                          : "border-gray-100 hover:border-pink-100"
                    }`}
                  >
                    <div
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() => handleSelectUser(u)}
                    >
                      <div className="relative flex-shrink-0">
                        <div
                          className={`w-12 h-12 bg-gradient-to-br ${avatarColors[index % avatarColors.length]} rounded-2xl flex items-center justify-center text-white font-bold text-lg`}
                        >
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 ${statusConfig.dot} ${statusConfig.animate} rounded-full border-2 border-white`}
                        ></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-bold text-[#1A1A2E] text-sm truncate">
                            {u.name}
                          </p>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusConfig.bg} ${statusConfig.color}`}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs">{u.relation}</p>
                        <div className="mt-1 space-y-0.5">
                          {u.location?.lastUpdated ? (
                            <p className="text-gray-400 text-xs">
                              📍{" "}
                              {formatDistanceToNow(
                                new Date(u.location.lastUpdated),
                                { addSuffix: true },
                              )}
                            </p>
                          ) : (
                            <p className="text-orange-400 text-xs">
                              📵 Not sharing location
                            </p>
                          )}
                          {isDanger && dangerInfo && (
                            <p className="text-red-500 text-xs font-semibold">
                              🆘 SOS{" "}
                              {formatDistanceToNow(new Date(dangerInfo.since), {
                                addSuffix: true,
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <a
                        href={`tel:${u.phone}`}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-50 text-green-600 text-xs font-semibold rounded-xl hover:bg-green-100"
                      >
                        <FiPhone className="text-sm" /> Call
                      </a>
                      {u.location && (
                        <a
                          href={`https://maps.google.com/?q=${u.location.latitude},${u.location.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-50 text-blue-600 text-xs font-semibold rounded-xl hover:bg-blue-100"
                        >
                          <MdLocationOn /> Maps
                        </a>
                      )}
                      {isDanger && (
                        <button
                          onClick={() => handleMarkSafe(u.id?.toString())}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-600"
                        >
                          <FiCheck /> Safe
                        </button>
                      )}
                      <button
                        onClick={() => setUnlinkTarget(u)}
                        className="w-8 h-8 bg-red-50 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-100 flex-shrink-0"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Map + Alerts */}
            <div className="lg:col-span-2 space-y-4">
              {/* Map */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#1A1A2E] text-sm">
                      {selectedUser
                        ? `📍 ${selectedUser.name}'s Location`
                        : "Select a person"}
                    </p>
                    {selectedUser?.location?.lastUpdated && (
                      <p className="text-gray-400 text-xs">
                        📍{" "}
                        {formatDistanceToNow(
                          new Date(selectedUser.location.lastUpdated),
                          { addSuffix: true },
                        )}
                        {dangerUsers[selectedUser?.id?.toString()] && (
                          <span className="text-red-500 font-semibold ml-2">
                            • 🆘 SOS{" "}
                            {formatDistanceToNow(
                              new Date(
                                dangerUsers[selectedUser.id.toString()].since,
                              ),
                              { addSuffix: true },
                            )}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  {connected && (
                    <div className="flex items-center gap-2 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      LIVE
                    </div>
                  )}
                </div>

                <MapContainer
                  center={mapPosition}
                  zoom={selectedUser?.location ? 15 : 5}
                  scrollWheelZoom={true}
                  className="h-64 sm:h-72 w-full"
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapUpdater position={mapPosition} />
                  {linkedUsers
                    .filter((u) => u.location)
                    .map((u) => (
                      <Marker
                        key={u.id}
                        position={[u.location.latitude, u.location.longitude]}
                        icon={createTrackedUserIcon(u.name?.split(" ")[0])}
                      >
                        <Popup>
                          <div>
                            <p style={{ fontWeight: 700 }}>{u.name}</p>
                            <p style={{ fontSize: "12px", color: "#666" }}>
                              {u.relation}
                            </p>
                            {u.location.lastUpdated && (
                              <p style={{ fontSize: "11px", color: "#999" }}>
                                📍{" "}
                                {formatDistanceToNow(
                                  new Date(u.location.lastUpdated),
                                  { addSuffix: true },
                                )}
                              </p>
                            )}
                            {dangerUsers[u.id?.toString()] && (
                              <p
                                style={{
                                  fontSize: "11px",
                                  color: "red",
                                  fontWeight: 700,
                                }}
                              >
                                🆘 SOS{" "}
                                {formatDistanceToNow(
                                  new Date(dangerUsers[u.id.toString()].since),
                                  { addSuffix: true },
                                )}
                              </p>
                            )}
                            <a
                              href={`https://maps.google.com/?q=${u.location.latitude},${u.location.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#E91E8C", fontSize: "12px" }}
                            >
                              Open in Google Maps ↗
                            </a>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                </MapContainer>

                {selectedUser && !selectedUser.location && (
                  <div className="p-4 bg-orange-50 border-t border-orange-100 flex items-center gap-3">
                    <MdWarning className="text-orange-500 text-xl flex-shrink-0" />
                    <p className="text-orange-700 text-sm">
                      <strong>{selectedUser.name}</strong> has not started
                      sharing location yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Alert Feed - from DB */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#1A1A2E] flex items-center gap-2">
                    <FiAlertCircle className="text-red-500 text-lg" />
                    Alert Feed
                    {alerts.length > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {alerts.length}
                      </span>
                    )}
                  </h3>
                  {alerts.length > 0 && (
                    <button
                      onClick={handleClearAlerts}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Clear View
                    </button>
                  )}
                </div>

                {alertsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-[#E91E8C] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-400 text-sm">Loading alerts...</p>
                  </div>
                ) : alerts.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="bg-red-50 border border-red-100 rounded-2xl p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <MdSecurity className="text-white text-lg" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-[#1A1A2E] font-bold text-sm">
                                  🆘 {alert.userName}
                                </p>
                                <p className="text-red-600 text-xs font-semibold">
                                  {alert.type}
                                </p>
                              </div>
                              {/* ✅ Only show map button if location is actually available */}
                              {alert.locationAvailable && alert.mapsLink && (
                                <a
                                  href={alert.mapsLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-xl hover:bg-blue-600"
                                >
                                  <MdLocationOn /> Map
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Address */}
                        <div className="mt-2 flex items-start gap-1.5 bg-white/60 rounded-xl px-3 py-2">
                          <span className="flex-shrink-0 text-xs mt-0.5">
                            📍
                          </span>
                          <p className="text-gray-600 text-xs leading-5 break-words">
                            {/* ✅ Show honest message if no location */}
                            {alert.locationAvailable
                              ? alert.address
                              : "Location was not available when SOS was triggered"}
                          </p>
                        </div>

                        {/* Time */}
                        <div className="mt-2 flex items-center gap-1.5 px-1">
                          <span className="text-gray-400 text-xs">🕐</span>
                          <span className="text-gray-400 text-xs">
                            {format(
                              new Date(alert.timestamp),
                              "dd MMM yyyy, hh:mm a",
                            )}
                          </span>
                          <span className="text-red-400 text-xs font-medium">
                            •{" "}
                            {formatDistanceToNow(new Date(alert.timestamp), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BsShieldFillCheck className="text-5xl text-green-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      No alerts — everyone is safe! 💚
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Alerts are stored in database
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Link Modal */}
        {showLinkModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-bold text-[#1A1A2E]">
                    Send Monitor Request
                  </h3>
                  <p className="text-gray-400 text-sm mt-0.5">
                    They must accept before you can monitor
                  </p>
                </div>
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500"
                >
                  <FiX />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-amber-700 text-xs font-semibold mb-1">
                    🔐 How this works
                  </p>
                  <p className="text-amber-600 text-xs leading-relaxed">
                    A request will appear on their SafeGuard dashboard. They
                    must <strong>Accept</strong> before you can see their
                    location.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
                    Their SafeGuard Email *
                  </label>
                  <input
                    type="email"
                    placeholder="their.email@example.com"
                    value={linkForm.email}
                    onChange={(e) =>
                      setLinkForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[#E91E8C] text-[#1A1A2E] placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
                    Your Relation *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {relations.map((rel) => (
                      <button
                        key={rel}
                        onClick={() =>
                          setLinkForm((prev) => ({ ...prev, relation: rel }))
                        }
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                          linkForm.relation === rel
                            ? "border-[#E91E8C] bg-pink-50 text-[#E91E8C]"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {rel}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-gray-100">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendRequest}
                  disabled={linkLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-[#E91E8C] to-pink-600 text-white font-semibold rounded-xl disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {linkLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiPlus />
                  )}
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unlink Confirm */}
        {unlinkTarget && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <FiTrash2 className="text-3xl text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">
                Remove {unlinkTarget.name}?
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                You will stop monitoring <strong>{unlinkTarget.name}</strong>.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setUnlinkTarget(null)}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUnlink(unlinkTarget.id)}
                  className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FamilyDashboard;
