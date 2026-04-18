import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  FiAlertCircle,
  FiFilter,
  FiSearch,
  FiX,
  FiMapPin,
  FiClock,
  FiUsers,
  FiEye,
  FiRefreshCw,
  FiMail,
  FiTrash2,
} from "react-icons/fi";
import {
  MdSecurity,
  MdLocationOn,
  MdMic,
  MdDirectionsRun,
  MdPeople,
} from "react-icons/md";
import { BsShieldFillCheck } from "react-icons/bs";
import {
  fetchAlertHistory,
  fetchNearbyAlertHistory,
  deleteOwnAlert,
  deleteNearbyAlertFromHistory,
} from "../../services/alertService";
import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";
import { format, formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

// ✅ Alert type config for Tab 1
const alertTypeConfig = {
  "Panic Button": {
    icon: <MdSecurity className="text-lg" />,
    color: "text-red-600",
    bg: "bg-red-100",
    badge: "bg-red-100 text-red-700",
  },
  "Voice Detection": {
    icon: <MdMic className="text-lg" />,
    color: "text-purple-600",
    bg: "bg-purple-100",
    badge: "bg-purple-100 text-purple-700",
  },
  "Motion Detection": {
    icon: <MdDirectionsRun className="text-lg" />,
    color: "text-orange-600",
    bg: "bg-orange-100",
    badge: "bg-orange-100 text-orange-700",
  },
  "Location Shared": {
    icon: <MdLocationOn className="text-lg" />,
    color: "text-blue-600",
    bg: "bg-blue-100",
    badge: "bg-blue-100 text-blue-700",
  },
};

// ✅ Gender display helper
const getGenderDisplay = (gender) => {
  switch (gender) {
    case "Female":
      return {
        label: "A woman",
        emoji: "👩",
        color: "text-pink-600",
        bg: "bg-pink-50",
      };
    case "Male":
      return {
        label: "A man",
        emoji: "👨",
        color: "text-blue-600",
        bg: "bg-blue-50",
      };
    default:
      return {
        label: "Someone",
        emoji: "🧑",
        color: "text-gray-600",
        bg: "bg-gray-50",
      };
  }
};

// ✅ Helper action label
const getHelperActionLabel = (action) => {
  switch (action) {
    case "called_police":
      return {
        label: "Called Police",
        emoji: "🚔",
        color: "text-blue-600",
        bg: "bg-blue-50",
      };
    case "going_to_help":
      return {
        label: "Went to Help",
        emoji: "🏃",
        color: "text-green-600",
        bg: "bg-green-50",
      };
    case "seen":
      return {
        label: "Marked as Seen",
        emoji: "👁",
        color: "text-gray-600",
        bg: "bg-gray-50",
      };
    default:
      return {
        label: "No Action Taken",
        emoji: "—",
        color: "text-gray-400",
        bg: "bg-gray-50",
      };
  }
};

// ✅ Approximate map modal - shows circle not pin
const ApproximateMapModal = ({ alert, onClose }) => {
  // Center of the circle - use areaName for display
  // We don't have exact coords for non-anonymous alerts
  // So we show a message + circle if we somehow have coords
  // If no coords → just show area name info

  const hasApproxCoords =
    alert.exactLocation?.latitude && alert.exactLocation?.longitude;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-[#1A1A2E]">Approximate Location</h3>
            <p className="text-gray-400 text-xs mt-0.5">
              Exact location is protected — showing general area only
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-200"
          >
            <FiX />
          </button>
        </div>

        {/* Map or Info */}
        {hasApproxCoords ? (
          <div className="h-72">
            <MapContainer
              center={[
                alert.exactLocation.latitude,
                alert.exactLocation.longitude,
              ]}
              zoom={13}
              scrollWheelZoom={false}
              className="h-full w-full"
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* ✅ Circle not pin - approximate area */}
              <Circle
                center={[
                  alert.exactLocation.latitude,
                  alert.exactLocation.longitude,
                ]}
                radius={800}
                pathOptions={{
                  color: "#E91E8C",
                  fillColor: "#E91E8C",
                  fillOpacity: 0.15,
                  weight: 2,
                }}
              >
                <Popup>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "13px" }}>
                      📍 Approximate Area
                    </p>
                    <p style={{ fontSize: "11px", color: "#666" }}>
                      {alert.areaName}
                    </p>
                    <p
                      style={{
                        fontSize: "10px",
                        color: "#999",
                        marginTop: "4px",
                      }}
                    >
                      Exact location not shared for privacy
                    </p>
                  </div>
                </Popup>
              </Circle>
            </MapContainer>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center bg-gray-50">
            <span className="text-4xl mb-3">📍</span>
            <p className="font-semibold text-gray-600 text-sm">
              Area: {alert.areaName || "Nearby area"}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Exact coordinates not available
            </p>
          </div>
        )}

        {/* Info footer */}
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl p-3">
            <span className="text-2xl">📌</span>
            <div>
              <p className="font-semibold text-orange-800 text-sm">
                {alert.areaName || "Nearby area"}
              </p>
              <p className="text-orange-600 text-xs">
                {alert.distance ? `~${alert.distance} km from you` : "Nearby"}
              </p>
            </div>
          </div>
          <p className="text-gray-400 text-xs text-center">
            🔒 Privacy protected — only approximate area shown
          </p>
        </div>
      </div>
    </div>
  );
};

// ✅ Exact map modal - shows pin (anonymous mode ON)
const ExactMapModal = ({ alert, onClose }) => {
  if (!alert.exactLocation?.latitude) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-[#1A1A2E]">Exact Location</h3>
            <p className="text-gray-400 text-xs mt-0.5">
              Shared because victim had Anonymous Mode ON
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-200"
          >
            <FiX />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            {alert.victimName && (
              <p className="text-sm font-semibold text-[#1A1A2E]">
                👤 {alert.victimName}
              </p>
            )}
            {alert.exactLocation?.address && (
              <p className="text-gray-600 text-xs leading-relaxed">
                📍 {alert.exactLocation.address}
              </p>
            )}
            <div className="flex gap-3 text-xs text-gray-400 font-mono">
              <span>Lat: {alert.exactLocation.latitude.toFixed(6)}°</span>
              <span>Lng: {alert.exactLocation.longitude.toFixed(6)}°</span>
            </div>
          </div>

          {alert.exactLocation?.mapsLink && (
            <a
              href={alert.exactLocation.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              <MdLocationOn className="text-lg" />
              Open in Google Maps ↗
            </a>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ✅ MAIN COMPONENT
// ============================================
const AlertHistory = () => {
  const [activeTab, setActiveTab] = useState("my-alerts");

  // ── Tab 1 state ──
  const [myAlerts, setMyAlerts] = useState([]);
  const [myLoading, setMyLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ── Tab 2 state ──
  const [nearbyAlerts, setNearbyAlerts] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const [nearbySearch, setNearbySearch] = useState("");
  const [nearbyFilterAction, setNearbyFilterAction] = useState("All");
  const [mapAlert, setMapAlert] = useState(null); // for approximate map
  const [exactMapAlert, setExactMapAlert] = useState(null); // for exact map
  const [deletingNearbyId, setDeletingNearbyId] = useState(null);

  const alertTypes = [
    "All",
    "Panic Button",
    "Voice Detection",
    "Motion Detection",
    "Location Shared",
  ];
  const actionFilters = [
    "All",
    "none",
    "called_police",
    "going_to_help",
    "seen",
  ];

  // ── Load Tab 1 ──
  const loadMyAlerts = async () => {
    setMyLoading(true);
    try {
      const res = await fetchAlertHistory();
      setMyAlerts(res.alerts || []);
    } catch {
      toast.error("Failed to load alerts");
    } finally {
      setMyLoading(false);
    }
  };

  // ── Load Tab 2 ──
  const loadNearbyAlerts = async () => {
    setNearbyLoading(true);
    try {
      const res = await fetchNearbyAlertHistory();
      setNearbyAlerts(res.alerts || []);
    } catch {
      toast.error("Failed to load nearby alert history");
    } finally {
      setNearbyLoading(false);
    }
  };

  useEffect(() => {
    loadMyAlerts();
    loadNearbyAlerts();
  }, []);

  // ── Tab 1 filter ──
  const filteredMyAlerts = myAlerts.filter((a) => {
    const matchSearch =
      a.location?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === "All" || a.type === filterType;
    return matchSearch && matchType;
  });

  // ── Tab 2 filter ──
  const filteredNearby = nearbyAlerts.filter((a) => {
    const matchSearch =
      a.areaName?.toLowerCase().includes(nearbySearch.toLowerCase()) ||
      a.victimName?.toLowerCase().includes(nearbySearch.toLowerCase()) ||
      a.alertType?.toLowerCase().includes(nearbySearch.toLowerCase());
    const matchAction =
      nearbyFilterAction === "All" || a.helperAction === nearbyFilterAction;
    return matchSearch && matchAction;
  });

  // ── Delete own alert ──
  const handleDeleteMyAlert = async (alertId) => {
    setDeletingId(alertId);
    try {
      await deleteOwnAlert(alertId);
      setMyAlerts((prev) => prev.filter((a) => a._id !== alertId));
      if (selectedAlert?._id === alertId) setSelectedAlert(null);
      toast.success("Alert deleted");
    } catch {
      toast.error("Failed to delete alert");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Delete nearby alert from history ──
  const handleDeleteNearby = async (historyId) => {
    setDeletingNearbyId(historyId);
    try {
      await deleteNearbyAlertFromHistory(historyId);
      setNearbyAlerts((prev) => prev.filter((a) => a._id !== historyId));
      toast.success("Removed from history");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeletingNearbyId(null);
    }
  };

  // ============================================
  // ✅ TAB 1 STATS
  // ============================================
  const tab1Stats = [
    {
      label: "Total Alerts",
      value: myAlerts.length,
      icon: <FiAlertCircle />,
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      label: "Panic Alerts",
      value: myAlerts.filter((a) => a.type === "Panic Button").length,
      icon: <MdSecurity />,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      label: "Emails Sent",
      value: myAlerts.reduce(
        (sum, a) =>
          sum + (a.contactsNotified?.filter((c) => c.emailSent).length || 0),
        0,
      ),
      icon: <FiMail />,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      label: "This Month",
      value: myAlerts.filter((a) => {
        const d = new Date(a.createdAt);
        const n = new Date();
        return (
          d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
        );
      }).length,
      icon: <FiClock />,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
  ];

  // ============================================
  // ✅ TAB 2 STATS
  // ============================================
  const tab2Stats = [
    {
      label: "Total Received",
      value: nearbyAlerts.length,
      icon: <MdPeople />,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      label: "Helped (Police)",
      value: nearbyAlerts.filter((a) => a.helperAction === "called_police")
        .length,
      icon: <span>🚔</span>,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Went to Help",
      value: nearbyAlerts.filter((a) => a.helperAction === "going_to_help")
        .length,
      icon: <span>🏃</span>,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      label: "No Action",
      value: nearbyAlerts.filter((a) => a.helperAction === "none").length,
      icon: <span>—</span>,
      color: "text-gray-400",
      bg: "bg-gray-50",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A2E]">Alert History</h2>
            <p className="text-gray-500 text-sm mt-1">
              View your emergency alerts and nearby SOS alerts you received
            </p>
          </div>
          <button
            onClick={() => {
              loadMyAlerts();
              loadNearbyAlerts();
            }}
            className="flex items-center gap-2 px-5 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:border-[#E91E8C] hover:text-[#E91E8C] transition-all"
          >
            <FiRefreshCw
              className={myLoading || nearbyLoading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* ── Tab Switcher ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-1.5 flex gap-1">
          <button
            onClick={() => setActiveTab("my-alerts")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
              activeTab === "my-alerts"
                ? "bg-[#E91E8C] text-white shadow-md"
                : "text-gray-500 hover:text-[#1A1A2E]"
            }`}
          >
            <FiAlertCircle />
            My Alerts
            {myAlerts.length > 0 && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  activeTab === "my-alerts"
                    ? "bg-white/20 text-white"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {myAlerts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("nearby-alerts")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
              activeTab === "nearby-alerts"
                ? "bg-[#E91E8C] text-white shadow-md"
                : "text-gray-500 hover:text-[#1A1A2E]"
            }`}
          >
            <MdPeople />
            Nearby Alerts
            {nearbyAlerts.length > 0 && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  activeTab === "nearby-alerts"
                    ? "bg-white/20 text-white"
                    : "bg-orange-100 text-orange-600"
                }`}
              >
                {nearbyAlerts.length}
              </span>
            )}
          </button>
        </div>

        {/* ══════════════════════════════════════════ */}
        {/* ✅ TAB 1 — MY ALERTS                      */}
        {/* ══════════════════════════════════════════ */}
        {activeTab === "my-alerts" && (
          <div className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {tab1Stats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-5 border border-gray-100"
                >
                  <div
                    className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}
                  >
                    <span className={`${stat.color} text-xl`}>{stat.icon}</span>
                  </div>
                  <div className="text-2xl font-bold text-[#1A1A2E]">
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by location or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[#E91E8C] text-[#1A1A2E] placeholder-gray-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <FiFilter className="text-gray-400" />
                  {alertTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        filterType === type
                          ? "bg-[#E91E8C] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Alert List */}
            {myLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-[#E91E8C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading alerts...</p>
                </div>
              </div>
            ) : filteredMyAlerts.length > 0 ? (
              <div className="space-y-3">
                {filteredMyAlerts.map((alert) => {
                  const config =
                    alertTypeConfig[alert.type] ||
                    alertTypeConfig["Panic Button"];
                  const isDeleting = deletingId === alert._id;
                  return (
                    <div
                      key={alert._id}
                      className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-all hover:border-pink-100"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className={`w-12 h-12 ${config.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}
                        >
                          <span className={config.color}>{config.icon}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-[#1A1A2E]">
                                {alert.type}
                              </h4>
                              <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.badge}`}
                              >
                                {alert.type}
                              </span>
                              <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                  alert.status === "Sent"
                                    ? "bg-green-100 text-green-700"
                                    : alert.status === "Partial"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                                }`}
                              >
                                {alert.status}
                              </span>
                              {/* ✅ Nearby count badge */}
                              {alert.nearbyUsersNotified > 0 && (
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                                  👥 {alert.nearbyUsersNotified} nearby notified
                                </span>
                              )}
                            </div>
                            <span className="text-gray-400 text-xs flex-shrink-0">
                              {format(
                                new Date(alert.createdAt),
                                "dd MMM yyyy, hh:mm a",
                              )}
                            </span>
                          </div>

                          {alert.location?.address && (
                            <div className="flex items-start gap-1.5 mb-1">
                              <FiMapPin className="text-[#E91E8C] text-xs mt-0.5 flex-shrink-0" />
                              <span className="text-gray-600 text-xs line-clamp-2">
                                {alert.location.address}
                              </span>
                            </div>
                          )}

                          {alert.location?.latitude && (
                            <div className="flex items-center gap-2 mb-2">
                              <MdLocationOn className="text-gray-400 text-xs flex-shrink-0" />
                              <span className="text-gray-400 font-mono text-xs">
                                {alert.location.latitude.toFixed(5)}°,{" "}
                                {alert.location.longitude.toFixed(5)}°
                              </span>
                              {alert.location?.mapsLink && (
                                <a
                                  href={alert.location.mapsLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-700 text-xs font-semibold hover:underline flex-shrink-0"
                                >
                                  View Map ↗
                                </a>
                              )}
                            </div>
                          )}

                          {/* Contacts notified */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <FiUsers className="text-gray-400 text-xs flex-shrink-0" />
                            {alert.contactsNotified?.map((contact, i) => (
                              <span
                                key={i}
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  contact.whatsappSent || contact.emailSent
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {contact.name}{" "}
                                {contact.whatsappSent || contact.emailSent
                                  ? "✓"
                                  : "✗"}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => setSelectedAlert(alert)}
                            className="w-9 h-9 bg-gray-50 hover:bg-pink-50 hover:text-[#E91E8C] text-gray-400 rounded-xl flex items-center justify-center transition-colors"
                          >
                            <FiEye className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleDeleteMyAlert(alert._id)}
                            disabled={isDeleting}
                            className="w-9 h-9 bg-gray-50 hover:bg-red-50 hover:text-red-500 text-gray-400 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            {isDeleting ? (
                              <div className="w-3 h-3 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
                            ) : (
                              <FiTrash2 className="text-sm" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
                <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
                  <BsShieldFillCheck className="text-5xl text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">
                  No Alerts Yet
                </h3>
                <p className="text-gray-500 text-sm">
                  {searchQuery || filterType !== "All"
                    ? "No matching alerts found"
                    : "You are safe! No emergency alerts triggered. 💚"}
                </p>
                {(searchQuery || filterType !== "All") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setFilterType("All");
                    }}
                    className="mt-4 text-[#E91E8C] font-semibold text-sm hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════ */}
        {/* ✅ TAB 2 — NEARBY ALERTS                  */}
        {/* ══════════════════════════════════════════ */}
        {activeTab === "nearby-alerts" && (
          <div className="space-y-5">
            {/* Info banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">ℹ️</span>
              <div>
                <p className="font-semibold text-amber-800 text-sm mb-1">
                  About Nearby Alerts
                </p>
                <p className="text-amber-700 text-xs leading-relaxed">
                  These are SOS alerts you received from nearby SafeGuard users.
                  Records auto-delete from the database after{" "}
                  <strong>24 hours</strong>. Exact location is only shown if the
                  victim had <strong>Anonymous Mode ON</strong> in their
                  settings.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {tab2Stats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-5 border border-gray-100"
                >
                  <div
                    className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}
                  >
                    <span className={`${stat.color} text-xl`}>{stat.icon}</span>
                  </div>
                  <div className="text-2xl font-bold text-[#1A1A2E]">
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by area, name or alert type..."
                    value={nearbySearch}
                    onChange={(e) => setNearbySearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[#E91E8C] text-[#1A1A2E] placeholder-gray-400"
                  />
                  {nearbySearch && (
                    <button
                      onClick={() => setNearbySearch("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <FiFilter className="text-gray-400" />
                  {[
                    { key: "All", label: "All" },
                    { key: "none", label: "No Action" },
                    { key: "called_police", label: "Called Police" },
                    { key: "going_to_help", label: "Went to Help" },
                    { key: "seen", label: "Seen" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setNearbyFilterAction(f.key)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        nearbyFilterAction === f.key
                          ? "bg-[#E91E8C] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Nearby Alert List */}
            {nearbyLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-[#E91E8C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading nearby alerts...</p>
                </div>
              </div>
            ) : filteredNearby.length > 0 ? (
              <div className="space-y-3">
                {filteredNearby.map((alert) => {
                  const genderInfo = getGenderDisplay(alert.victimGender);
                  const actionInfo = getHelperActionLabel(alert.helperAction);
                  const isDeleting = deletingNearbyId === alert._id;
                  // ✅ isExactLocation = anonymous mode was ON for victim
                  const isExact = alert.isExactLocation;

                  return (
                    <div
                      key={alert._id}
                      className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-all hover:border-orange-100"
                    >
                      <div className="flex items-start gap-4">
                        {/* Gender avatar */}
                        <div
                          className={`w-12 h-12 ${genderInfo.bg} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0`}
                        >
                          {genderInfo.emoji}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Top row */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                            <div>
                              {/* ✅ Name only if anonymous mode ON */}
                              <h4 className="font-bold text-[#1A1A2E] text-sm">
                                {isExact && alert.victimName
                                  ? `${alert.victimName} needed help`
                                  : `${genderInfo.label} needed help nearby`}
                              </h4>
                              <p
                                className={`text-xs font-semibold ${genderInfo.color}`}
                              >
                                {genderInfo.label} •{" "}
                                {alert.alertType || "Panic Button"}
                              </p>
                            </div>
                            <span className="text-gray-400 text-xs flex-shrink-0">
                              {format(
                                new Date(alert.receivedAt),
                                "dd MMM yyyy, hh:mm a",
                              )}
                              <br />
                              <span className="text-gray-300">
                                {formatDistanceToNow(
                                  new Date(alert.receivedAt),
                                  { addSuffix: true },
                                )}
                              </span>
                            </span>
                          </div>

                          {/* Distance + Area */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
                              📍 {alert.distance} km away
                            </span>
                            <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
                              📌 {alert.areaName || "Nearby area"}
                            </span>
                          </div>

                          {/* ✅ Exact address only if anonymous ON */}
                          {isExact && alert.exactLocation?.address && (
                            <div className="flex items-start gap-1.5 mb-2">
                              <MdLocationOn className="text-[#E91E8C] text-xs mt-0.5 flex-shrink-0" />
                              <p className="text-gray-600 text-xs leading-relaxed">
                                {alert.exactLocation.address}
                              </p>
                            </div>
                          )}

                          {/* ✅ Privacy notice if NOT exact */}
                          {!isExact && (
                            <p className="text-gray-400 text-xs mb-2 italic">
                              🔒 Exact location protected — victim's Anonymous
                              Mode was OFF
                            </p>
                          )}

                          {/* Helper action taken */}
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${actionInfo.bg} ${actionInfo.color}`}
                          >
                            <span>{actionInfo.emoji}</span>
                            {actionInfo.label}
                          </div>
                        </div>

                        {/* Right side buttons */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {/* ✅ Map button */}
                          <button
                            onClick={() =>
                              isExact
                                ? setExactMapAlert(alert)
                                : setMapAlert(alert)
                            }
                            className="w-9 h-9 bg-blue-50 hover:bg-blue-100 text-blue-500 rounded-xl flex items-center justify-center transition-colors"
                            title={
                              isExact
                                ? "View exact location"
                                : "View approximate area"
                            }
                          >
                            <MdLocationOn className="text-sm" />
                          </button>

                          {/* ✅ Delete button */}
                          <button
                            onClick={() => handleDeleteNearby(alert._id)}
                            disabled={isDeleting}
                            className="w-9 h-9 bg-gray-50 hover:bg-red-50 hover:text-red-500 text-gray-400 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            {isDeleting ? (
                              <div className="w-3 h-3 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
                            ) : (
                              <FiTrash2 className="text-sm" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
                <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
                  <MdPeople className="text-5xl text-orange-300" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">
                  No Nearby Alerts
                </h3>
                <p className="text-gray-500 text-sm">
                  {nearbySearch || nearbyFilterAction !== "All"
                    ? "No matching nearby alerts found"
                    : "No nearby SOS alerts received. Stay safe! 💚"}
                </p>
                {(nearbySearch || nearbyFilterAction !== "All") && (
                  <button
                    onClick={() => {
                      setNearbySearch("");
                      setNearbyFilterAction("All");
                    }}
                    className="mt-4 text-[#E91E8C] font-semibold text-sm hover:underline"
                  >
                    Clear filters
                  </button>
                )}
                <p className="text-gray-300 text-xs mt-4">
                  Records auto-delete after 24 hours from database
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════ */}
      {/* ✅ MY ALERT DETAIL MODAL (Tab 1)           */}
      {/* ══════════════════════════════════════════ */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl my-4 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 ${alertTypeConfig[selectedAlert.type]?.bg} rounded-xl flex items-center justify-center`}
                >
                  <span className={alertTypeConfig[selectedAlert.type]?.color}>
                    {alertTypeConfig[selectedAlert.type]?.icon}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-[#1A1A2E]">Alert Details</h3>
                  <p className="text-gray-400 text-xs">{selectedAlert.type}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <FiX />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Status */}
              <div
                className={`flex items-center justify-between p-4 rounded-2xl ${
                  selectedAlert.status === "Sent"
                    ? "bg-green-50 border border-green-100"
                    : selectedAlert.status === "Partial"
                      ? "bg-yellow-50 border border-yellow-100"
                      : "bg-red-50 border border-red-100"
                }`}
              >
                <span className="text-gray-600 font-medium text-sm">
                  Status
                </span>
                <span
                  className={`font-bold text-sm ${
                    selectedAlert.status === "Sent"
                      ? "text-green-700"
                      : selectedAlert.status === "Partial"
                        ? "text-yellow-700"
                        : "text-red-700"
                  }`}
                >
                  {selectedAlert.status === "Sent" && "✅ "}
                  {selectedAlert.status === "Partial" && "⚠️ "}
                  {selectedAlert.status === "Failed" && "❌ "}
                  {selectedAlert.status}
                </span>
              </div>

              {/* Nearby Users Notified */}
              {selectedAlert.nearbyUsersNotified > 0 && (
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <span className="text-gray-600 font-medium text-sm">
                    Nearby Users Notified
                  </span>
                  <span className="font-bold text-blue-700 text-sm">
                    👥 {selectedAlert.nearbyUsersNotified} users
                  </span>
                </div>
              )}

              {/* Type + Time */}
              {[
                {
                  label: "Alert Type",
                  value: selectedAlert.type,
                  icon: <FiAlertCircle className="text-[#E91E8C]" />,
                },
                {
                  label: "Date & Time",
                  value: format(
                    new Date(selectedAlert.createdAt),
                    "dd MMM yyyy, hh:mm:ss a",
                  ),
                  icon: <FiClock className="text-[#E91E8C]" />,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 py-3 border-b border-gray-100"
                >
                  <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">{item.label}</p>
                    <p className="text-[#1A1A2E] font-semibold text-sm">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}

              {/* Location */}
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    📍 Location Information
                  </p>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Place Name</p>
                    <p className="text-[#1A1A2E] font-semibold text-sm leading-relaxed">
                      {selectedAlert.location?.address || "Not available"}
                    </p>
                  </div>
                  {selectedAlert.location?.latitude && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-gray-400 text-xs mb-2">
                        GPS Coordinates
                      </p>
                      <div className="flex gap-4">
                        <div>
                          <p className="text-gray-400 text-xs">Latitude</p>
                          <p className="text-[#1A1A2E] font-mono font-bold text-sm">
                            {selectedAlert.location.latitude.toFixed(6)}°
                          </p>
                        </div>
                        <div className="border-l border-gray-200 pl-4">
                          <p className="text-gray-400 text-xs">Longitude</p>
                          <p className="text-[#1A1A2E] font-mono font-bold text-sm">
                            {selectedAlert.location.longitude.toFixed(6)}°
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedAlert.location?.mapsLink && (
                    <a
                      href={selectedAlert.location.mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                    >
                      <MdLocationOn className="text-lg" />
                      Open in Google Maps ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Contacts */}
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    👥 Contacts Notified (
                    {selectedAlert.contactsNotified?.length || 0})
                  </p>
                </div>
                <div className="p-4 space-y-3">
                  {selectedAlert.contactsNotified?.map((contact, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {contact.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[#1A1A2E] text-sm font-bold">
                            {contact.name}
                          </p>
                          {contact.phone && (
                            <p className="text-gray-400 text-xs">
                              {contact.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <div
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                            contact.whatsappSent
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          📱 WhatsApp{" "}
                          {contact.whatsappSent ? "✓ Sent" : "✗ Failed"}
                        </div>
                        <div
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                            contact.emailSent
                              ? "bg-green-100 text-green-700"
                              : contact.email
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <FiMail className="text-xs" />
                          Email{" "}
                          {contact.emailSent
                            ? "✓ Sent"
                            : contact.email
                              ? "✗ Failed"
                              : "No email"}
                        </div>
                      </div>
                      {contact.emailError && !contact.emailSent && (
                        <p className="text-red-400 text-xs mt-1">
                          Email: {contact.emailError}
                        </p>
                      )}
                    </div>
                  ))}
                  {(!selectedAlert.contactsNotified ||
                    selectedAlert.contactsNotified.length === 0) && (
                    <p className="text-gray-400 text-sm text-center py-4">
                      No contacts were notified
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setSelectedAlert(null)}
                className="w-full py-3 bg-gradient-to-r from-[#E91E8C] to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Approximate Map Modal (anonymous OFF) */}
      {mapAlert && (
        <ApproximateMapModal
          alert={mapAlert}
          onClose={() => setMapAlert(null)}
        />
      )}

      {/* ✅ Exact Map Modal (anonymous ON) */}
      {exactMapAlert && (
        <ExactMapModal
          alert={exactMapAlert}
          onClose={() => setExactMapAlert(null)}
        />
      )}
    </DashboardLayout>
  );
};

export default AlertHistory;
