import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import {
  FiMapPin,
  FiClock,
  FiCrosshair,
  FiPlay,
  FiPause,
  FiWifi,
} from "react-icons/fi";
import { MdLocationOn } from "react-icons/md";
import { useSocket } from "../../context/SocketContext";
import { useTracking } from "../../context/TrackingContext";
import L from "leaflet";

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
  const {
    tracking,
    position,
    accuracy,
    lastUpdated,
    locationCount,
    startTracking,
    stopTracking,
  } = useTracking();

  const customIcon = createCustomIcon();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
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

        {/* Tracking persists banner */}
        {tracking && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
            <p className="text-green-700 text-sm font-medium">
              ✅ Tracking is active and will continue even if you navigate to
              other pages. Click "Stop Tracking" to end it.
            </p>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Map */}
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          {position ? (
            <MapContainer
              center={position}
              zoom={17}
              scrollWheelZoom={true}
              className="h-[500px] w-full"
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapUpdater position={position} />
              <Marker position={position} icon={customIcon}>
                <Popup>
                  <div style={{ fontWeight: 600 }}>📍 You Are Here</div>
                  <div style={{ fontSize: "12px", marginTop: "4px" }}>
                    Lat: {position[0].toFixed(6)} <br />
                    Lng: {position[1].toFixed(6)} <br />
                    Accuracy: ±{accuracy}m
                  </div>
                </Popup>
              </Marker>
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
    </DashboardLayout>
  );
};

export default LiveLocation;
