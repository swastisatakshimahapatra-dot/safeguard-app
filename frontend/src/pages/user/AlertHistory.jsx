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
  FiPhone,
} from "react-icons/fi";
import {
  MdSecurity,
  MdLocationOn,
  MdMic,
  MdDirectionsRun,
} from "react-icons/md";
import { BsShieldFillCheck } from "react-icons/bs";
import { fetchAlertHistory } from "../../services/alertService";
import { format } from "date-fns";
import toast from "react-hot-toast";

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

const AlertHistory = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [selectedAlert, setSelectedAlert] = useState(null);

  const alertTypes = [
    "All",
    "Panic Button",
    "Voice Detection",
    "Motion Detection",
    "Location Shared",
  ];

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const response = await fetchAlertHistory();
      setAlerts(response.alerts || []);
    } catch (error) {
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const filteredAlerts = alerts.filter((alert) => {
    const matchSearch =
      alert.location?.address
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      alert.type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === "All" || alert.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A2E]">Alert History</h2>
            <p className="text-gray-500 text-sm mt-1">
              Real-time log from database
            </p>
          </div>
          <button
            onClick={loadAlerts}
            className="flex items-center gap-2 px-5 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:border-[#E91E8C] hover:text-[#E91E8C] transition-all"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Alerts",
              value: alerts.length,
              icon: <FiAlertCircle />,
              color: "text-red-500",
              bg: "bg-red-50",
            },
            {
              label: "Panic Alerts",
              value: alerts.filter((a) => a.type === "Panic Button").length,
              icon: <MdSecurity />,
              color: "text-orange-500",
              bg: "bg-orange-50",
            },
            {
              label: "Emails Sent",
              value: alerts.reduce(
                (sum, a) =>
                  sum +
                  (a.contactsNotified?.filter((c) => c.emailSent).length || 0),
                0,
              ),
              icon: <FiMail />,
              color: "text-green-500",
              bg: "bg-green-50",
            },
            {
              label: "This Month",
              value: alerts.filter((a) => {
                const alertDate = new Date(a.createdAt);
                const now = new Date();
                return alertDate.getMonth() === now.getMonth();
              }).length,
              icon: <FiClock />,
              color: "text-blue-500",
              bg: "bg-blue-50",
            },
          ].map((stat, i) => (
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
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#E91E8C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading alerts...</p>
            </div>
          </div>
        ) : filteredAlerts.length > 0 ? (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
              const config =
                alertTypeConfig[alert.type] || alertTypeConfig["Panic Button"];
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
                      {/* Top row - type + status + time */}
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
                        </div>
                        <span className="text-gray-400 text-xs flex-shrink-0">
                          {format(
                            new Date(alert.createdAt),
                            "dd MMM yyyy, hh:mm a",
                          )}
                        </span>
                      </div>

                      {/* ✅ Place Name */}
                      {alert.location?.address && (
                        <div className="flex items-start gap-1.5 mb-1">
                          <FiMapPin className="text-[#E91E8C] text-xs mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 text-xs line-clamp-2">
                            {alert.location.address}
                          </span>
                        </div>
                      )}

                      {/* ✅ GPS Coordinates + Maps Link */}
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

                    {/* Eye Button */}
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="flex-shrink-0 w-10 h-10 bg-gray-50 hover:bg-pink-50 hover:text-[#E91E8C] text-gray-400 rounded-xl flex items-center justify-center transition-colors"
                    >
                      <FiEye className="text-sm" />
                    </button>
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

        {/* ✅ Alert Detail Modal */}
        {selectedAlert && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl my-4 flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 ${alertTypeConfig[selectedAlert.type]?.bg} rounded-xl flex items-center justify-center`}
                  >
                    <span
                      className={alertTypeConfig[selectedAlert.type]?.color}
                    >
                      {alertTypeConfig[selectedAlert.type]?.icon}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A1A2E]">Alert Details</h3>
                    <p className="text-gray-400 text-xs">
                      {selectedAlert.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-200"
                >
                  <FiX />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Status Badge */}
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

                {/* Alert Type + Time */}
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
                      <p className="text-gray-400 text-xs mb-0.5">
                        {item.label}
                      </p>
                      <p className="text-[#1A1A2E] font-semibold text-sm">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}

                {/* ✅ Location Section */}
                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      📍 Location Information
                    </p>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Place Name */}
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Place Name</p>
                      <p className="text-[#1A1A2E] font-semibold text-sm leading-relaxed">
                        {selectedAlert.location?.address || "Not available"}
                      </p>
                    </div>

                    {/* GPS Coordinates */}
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

                    {/* ✅ Maps Link Button */}
                    {selectedAlert.location?.mapsLink && (
                      <a
                        href={selectedAlert.location.mapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all"
                      >
                        <MdLocationOn className="text-lg" />
                        Open in Google Maps ↗
                      </a>
                    )}
                  </div>
                </div>

                {/* ✅ Contacts Notified Section */}
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
                        {/* Contact name + avatar */}
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

                        {/* SMS + Email status */}
                        <div className="flex gap-2 flex-wrap">
                          {/* WhatsApp Status */}
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

                          {/* Email Status */}
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

                        {/* Error messages */}
                        {contact.smsError && !contact.smsSent && (
                          <p className="text-red-400 text-xs mt-2">
                            SMS: {contact.smsError}
                          </p>
                        )}
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

              {/* Modal Footer */}
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
      </div>
    </DashboardLayout>
  );
};

export default AlertHistory;
