import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
} from "react-leaflet";
import {
  FiMapPin,
  FiClock,
  FiCrosshair,
  FiPlay,
  FiPause,
  FiWifi,
  FiAlertTriangle,
  FiShield,
  FiNavigation,
} from "react-icons/fi";
import { MdLocationOn } from "react-icons/md";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { useTracking } from "../../context/TrackingContext";
import L from "leaflet";
import {
  getDangerZones,
  getRiskColor,
  getSafeRouteURL,
} from "../../services/dangerZoneService";
import { useDangerZoneDetection } from "../../hooks/useDangerZoneDetection";
import DangerZoneWarning from "../../components/DangerZoneWarning";
import DangerZoneLegend from "../../components/DangerZoneLegend";
import toast from "react-hot-toast";

const MapUpdater = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom());
  }, [position]);
  return null;
};

const createCustomIcon = () =>
  L.divIcon({
    className: "",
    html: `
    <div style="display:flex;flex-direction:column;align-items:center;">
      <div style="background:#1A1A2E;color:white;font-size:11px;font-weight:600;padding:2px 8px;border-radius:6px;margin-bottom:4px;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.2);">You</div>
      <div style="width:18px;height:18px;background:#E91E8C;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(233,30,140,0.3);"></div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 30],
  });

const LiveLocation = () => {
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  const {
    tracking,
    position,
    accuracy,
    lastUpdated,
    locationCount,
    startTracking,
    stopTracking,
  } = useTracking();

  // ✅ Danger zone states
  const [dangerZones, setDangerZones] = useState([]);
  const [showZones, setShowZones] = useState(true);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const zonesLoadedRef = useRef(false);

  const customIcon = createCustomIcon();

  // ✅ Danger zone detection hook
  const { isInDangerZone, currentDangerZone } = useDangerZoneDetection(
    position,
    dangerZones,
    socket,
    user?.id || user?._id,
  );

  useEffect(() => {
    if (position && !zonesLoadedRef.current) {
      zonesLoadedRef.current = true;
      loadDangerZones();
    }
  }, [position]);

  const loadDangerZones = async () => {
    if (!position) return;

    setZonesLoading(true);
    try {
      const zones = await getDangerZones(position[0], position[1]);
      setDangerZones(zones);
      console.log("✅ Loaded", zones.length, "danger zones");
    } catch (error) {
      console.error("Failed to load danger zones:", error);
      toast.error("Failed to load danger zones");
    } finally {
      setZonesLoading(false);
    }
  };

  // ✅ Handle "Get Me Out" button
  const handleGetMeOut = () => {
    if (!position || !currentDangerZone) return;

    // Navigate away from danger zone
    const safeLat = position[0] - 0.01; // Move 1km south
    const safeLon = position[1];

    const url = getSafeRouteURL(
      position[0],
      position[1],
      safeLat,
      safeLon,
      dangerZones,
    );

    window.open(url, "_blank");
    toast.success("Opening safe route navigation");
  };

  // ✅ Handle call police
  const handleCallPolice = () => {
    window.location.href = "tel:100";
  };

  // ✅ Refresh danger zones
  const handleRefreshZones = () => {
    loadDangerZones();
    toast.loading("Refreshing danger zones...", { id: "refresh-zones" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Danger Zone Warning */}
        {isInDangerZone && currentDangerZone && showWarning && (
          <DangerZoneWarning
            zone={currentDangerZone}
            onDismiss={() => setShowWarning(false)}
            onGetMeOut={handleGetMeOut}
            onCallPolice={handleCallPolice}
          />
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A2E]">Live Location</h2>
            <p className="text-gray-500 text-sm mt-1">
              {tracking
                ? "🟢 Tracking active — continues even when you change pages"
                : "Click Start Tracking to begin sharing your location"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${connected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
            >
              <FiWifi />
              {connected ? "Connected" : "Disconnected"}
            </div>
            <button
              onClick={tracking ? stopTracking : () => startTracking(false)}
              className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all ${
                tracking
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-gradient-to-r from-[#E91E8C] to-pink-600 text-white hover:shadow-lg"
              }`}
            >
              {tracking ? <FiPause /> : <FiPlay />}
              {tracking ? "Stop Tracking" : "Start Tracking"}
            </button>
          </div>
        </div>

        {/* Danger Zone Alert Banner */}
        {isInDangerZone && (
          <div className="bg-red-500 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <FiAlertTriangle className="text-white text-xl" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">
                ⚠️ YOU ARE IN A DANGER ZONE
              </p>
              <p className="text-red-100 text-xs">
                {currentDangerZone?.name} —{" "}
                {currentDangerZone?.currentRisk.toUpperCase()} RISK
              </p>
            </div>
            <button
              onClick={handleGetMeOut}
              className="px-4 py-2 bg-white text-red-500 font-bold rounded-xl text-sm hover:bg-red-50 transition-colors flex-shrink-0"
            >
              Get Me Out →
            </button>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              icon: <MdLocationOn className="text-xl" />,
              label: "Status",
              value: tracking ? "Live" : "Stopped",
              color: tracking ? "text-green-500" : "text-gray-400",
              bg: tracking ? "bg-green-50" : "bg-gray-50",
            },
            {
              icon: <FiCrosshair className="text-xl" />,
              label: "Accuracy",
              value: accuracy ? `±${accuracy}m` : "--",
              color: "text-blue-500",
              bg: "bg-blue-50",
            },
            {
              icon: <FiClock className="text-xl" />,
              label: "Last Update",
              value: lastUpdated ? lastUpdated.toLocaleTimeString() : "--",
              color: "text-purple-500",
              bg: "bg-purple-50",
            },
            {
              icon: <FiMapPin className="text-xl" />,
              label: "Points Saved",
              value: locationCount,
              color: "text-pink-500",
              bg: "bg-pink-50",
            },
            {
              icon: <FiShield className="text-xl" />,
              label: "Safety Status",
              value: isInDangerZone ? "DANGER" : "Safe",
              color: isInDangerZone ? "text-red-500" : "text-green-500",
              bg: isInDangerZone ? "bg-red-50" : "bg-green-50",
            },
          ].map((card, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
            >
              <div
                className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}
              >
                <span className={card.color}>{card.icon}</span>
              </div>
              <div className={`text-lg font-bold ${card.color}`}>
                {card.value}
              </div>
              <div className="text-gray-400 text-xs mt-0.5">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Coordinates Bar */}
        {position && (
          <div className="bg-[#1A1A2E] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FiMapPin className="text-[#E91E8C]" />
              <span className="text-white text-sm font-medium">
                Current Coordinates:
              </span>
            </div>
            <div className="flex gap-4">
              <div>
                <span className="text-gray-400 text-xs">Latitude</span>
                <p className="text-white font-mono font-bold">
                  {position[0].toFixed(6)}°
                </p>
              </div>
              <div className="w-px bg-white/10"></div>
              <div>
                <span className="text-gray-400 text-xs">Longitude</span>
                <p className="text-white font-mono font-bold">
                  {position[1].toFixed(6)}°
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1.5">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-xs font-bold">LIVE</span>
            </div>
          </div>
        )}

        {/* Danger Zones Stats */}
        {dangerZones.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "High Risk Zones",
                value: dangerZones.filter((z) => z.risk === "high").length,
                color: "text-red-500",
                bg: "bg-red-50",
              },
              {
                label: "Medium Risk Zones",
                value: dangerZones.filter((z) => z.risk === "medium").length,
                color: "text-yellow-500",
                bg: "bg-yellow-50",
              },
              {
                label: "Low Risk Zones",
                value: dangerZones.filter((z) => z.risk === "low").length,
                color: "text-green-500",
                bg: "bg-green-50",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 border border-gray-100 text-center"
              >
                <div className={`text-3xl font-bold ${stat.color} mb-1`}>
                  {stat.value}
                </div>
                <div className="text-gray-500 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Map + Legend */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Legend Sidebar */}
          <div className="lg:col-span-1 space-y-3">
            <DangerZoneLegend
              zones={dangerZones}
              showZones={showZones}
              setShowZones={setShowZones}
            />

            {/* Refresh Button */}
            <button
              onClick={handleRefreshZones}
              disabled={zonesLoading}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:border-[#E91E8C] hover:text-[#E91E8C] transition-all text-sm"
            >
              <FiNavigation className={zonesLoading ? "animate-spin" : ""} />
              Refresh Zones
            </button>

            {/* Safety Tips */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="font-bold text-blue-900 text-sm mb-2">
                🛡️ Safety Tips
              </p>
              <ul className="text-blue-700 text-xs space-y-1.5 list-disc list-inside">
                <li>Avoid red zones, especially at night</li>
                <li>Stay on well-lit main roads</li>
                <li>Share location with family</li>
                <li>Keep phone charged</li>
                <li>Trust your instincts</li>
              </ul>
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              {position ? (
                <MapContainer
                  center={position}
                  zoom={14}
                  scrollWheelZoom={true}
                  className="h-[500px] w-full"
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapUpdater position={position} />

                  {/* User location marker */}
                  <Marker position={position} icon={customIcon}>
                    <Popup>
                      <div style={{ fontWeight: 600 }}>
                        📍 You Are Here
                        <br />
                        Lat: {position[0].toFixed(6)} <br />
                        Lng: {position[1].toFixed(6)} <br />
                        Accuracy: ±{accuracy}m
                      </div>
                    </Popup>
                  </Marker>

                  {/* Danger zone circles */}
                  {showZones &&
                    dangerZones.map((zone) => {
                      const colors = getRiskColor(zone.risk);
                      return (
                        <Circle
                          key={zone.id}
                          center={[zone.latitude, zone.longitude]}
                          radius={zone.radius}
                          pathOptions={{
                            color: colors.border,
                            fillColor: colors.border,
                            fillOpacity: 0.15,
                            weight: 2,
                          }}
                        >
                          <Popup>
                            <div style={{ minWidth: "200px" }}>
                              <p
                                style={{
                                  fontWeight: 700,
                                  fontSize: "14px",
                                  marginBottom: "4px",
                                }}
                              >
                                {zone.name}
                              </p>
                              <p
                                style={{
                                  fontSize: "12px",
                                  color: colors.border,
                                  fontWeight: 700,
                                  marginBottom: "8px",
                                }}
                              >
                                {zone.risk.toUpperCase()} RISK
                              </p>
                              <p
                                style={{
                                  fontSize: "11px",
                                  color: "#666",
                                  marginBottom: "8px",
                                }}
                              >
                                {zone.reason}
                              </p>
                              {zone.activeHours && (
                                <p
                                  style={{
                                    fontSize: "10px",
                                    color: "#999",
                                    marginBottom: "8px",
                                  }}
                                >
                                  🕐 Dangerous: {zone.activeHours.start} -{" "}
                                  {zone.activeHours.end}
                                </p>
                              )}
                              <a
                                href={`tel:100`}
                                style={{
                                  display: "block",
                                  textAlign: "center",
                                  padding: "8px",
                                  background: "#dc2626",
                                  color: "white",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  textDecoration: "none",
                                }}
                              >
                                📞 Call Police
                              </a>
                            </div>
                          </Popup>
                        </Circle>
                      );
                    })}
                </MapContainer>
              ) : (
                <div className="h-[500px] flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                  <div className="w-20 h-20 bg-pink-50 rounded-3xl flex items-center justify-center mb-4">
                    <FiMapPin className="text-4xl text-[#E91E8C]" />
                  </div>
                  <p className="font-semibold text-gray-500">
                    Map will appear here
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Click "Start Tracking" to begin
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LiveLocation;
