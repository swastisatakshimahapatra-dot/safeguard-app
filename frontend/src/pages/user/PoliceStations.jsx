import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import { FiPhone, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import { MdLocalPolice, MdDirections } from "react-icons/md";
import toast from "react-hot-toast";

// ============================================
// Map updater
// ============================================
const MapUpdater = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 14);
  }, [position]);
  return null;
};

// ============================================
// Icons
// ============================================
const createUserIcon = () =>
  L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="background:#1A1A2E;color:white;font-size:11px;font-weight:600;
        padding:2px 8px;border-radius:6px;margin-bottom:4px;white-space:nowrap;
        box-shadow:0 2px 4px rgba(0,0,0,0.2);">You</div>
        <div style="width:18px;height:18px;background:#E91E8C;border-radius:50%;
        border:3px solid white;box-shadow:0 0 0 3px rgba(233,30,140,0.3);"></div>
      </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 30],
  });

const createPoliceIcon = (isNearest = false) =>
  L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="
          background:${isNearest ? "#1565C0" : "#1976D2"};
          color:white;font-size:10px;font-weight:700;
          padding:2px 6px;border-radius:6px;margin-bottom:4px;
          white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);
          border:${isNearest ? "2px solid #FFD700" : "none"};
        ">🚔 Police</div>
        <div style="
          width:${isNearest ? "22px" : "18px"};
          height:${isNearest ? "22px" : "18px"};
          background:${isNearest ? "#1565C0" : "#1976D2"};
          border-radius:50%;
          border:${isNearest ? "3px solid #FFD700" : "3px solid white"};
          box-shadow:0 0 0 3px rgba(25,118,210,0.4);
        "></div>
      </div>`,
    iconSize: [60, 45],
    iconAnchor: [30, 40],
  });

// ============================================
// Distance calculator
// ============================================
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
};

// ============================================
// Cache + Blacklist - outside component
// so they persist across re-renders
// ============================================
const stationsCache = new Map();
const endpointBlacklist = new Map();

const getCacheKey = (lat, lon, radius) =>
  `${parseFloat(lat).toFixed(3)}_${parseFloat(lon).toFixed(3)}_${radius}`;

const isBlacklisted = (endpoint) => {
  if (!endpointBlacklist.has(endpoint)) return false;
  const until = endpointBlacklist.get(endpoint);
  if (Date.now() > until) {
    endpointBlacklist.delete(endpoint);
    return false;
  }
  return true;
};

const blacklistEndpoint = (endpoint, minutes = 2) => {
  endpointBlacklist.set(endpoint, Date.now() + minutes * 60 * 1000);
  console.log(`🚫 Blacklisted ${endpoint} for ${minutes} min`);
};

// ============================================
// Overpass endpoints - 3 mirrors
// ============================================
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

// ============================================
// Fetch from Overpass - tries all 3 mirrors
// ============================================
const fetchFromOverpass = async (lat, lon, radius) => {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="police"](around:${radius},${lat},${lon});
      way["amenity"="police"](around:${radius},${lat},${lon});
    );
    out body;
  `;

  let lastError = null;
  let triedAny = false;

  for (let i = 0; i < OVERPASS_ENDPOINTS.length; i++) {
    const endpoint = OVERPASS_ENDPOINTS[i];

    // ✅ Skip blacklisted endpoints
    if (isBlacklisted(endpoint)) {
      console.log(`⏭️ Skipping blacklisted: ${endpoint}`);
      continue;
    }

    triedAny = true;

    // ✅ Small delay between retries to avoid rate limiting
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    try {
      console.log(`🔍 Overpass trying: ${endpoint}`);

      const response = await Promise.race([
        fetch(`${endpoint}?data=${encodeURIComponent(query)}`),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 20000),
        ),
      ]);

      // ✅ Handle each error type - blacklist and try next
      if (response.status === 429) {
        console.log(`⚠️ Rate limited by ${endpoint}`);
        blacklistEndpoint(endpoint, 3);
        lastError = new Error("Rate limited");
        continue;
      }

      if (response.status === 403) {
        console.log(`⚠️ Forbidden by ${endpoint}`);
        blacklistEndpoint(endpoint, 10);
        lastError = new Error("HTTP 403");
        continue;
      }

      if (response.status === 504 || response.status === 502) {
        console.log(`⚠️ Gateway timeout ${endpoint}`);
        blacklistEndpoint(endpoint, 2);
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }

      if (!response.ok) {
        console.log(`⚠️ HTTP error ${response.status} from ${endpoint}`);
        blacklistEndpoint(endpoint, 2);
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();
      const results = data.elements.filter(
        (el) => el.type === "node" && el.lat && el.lon,
      );

      console.log(
        `✅ Overpass got ${results.length} stations from ${endpoint}`,
      );

      // ✅ Map to clean format
      return results.map((station) => ({
        id: String(station.id),
        name:
          station.tags?.name || station.tags?.["name:en"] || "Police Station",
        lat: station.lat,
        lon: station.lon,
        address:
          station.tags?.["addr:full"] || station.tags?.["addr:street"] || null,
        phone: station.tags?.phone || station.tags?.["contact:phone"] || null,
      }));
    } catch (error) {
      console.log(`❌ Overpass ${endpoint} failed: ${error.message}`);
      // ✅ Blacklist on timeout too
      if (error.message === "timeout") {
        blacklistEndpoint(endpoint, 2);
      }
      lastError = error;
      continue;
    }
  }

  // ✅ All endpoints failed or blacklisted
  if (!triedAny) {
    throw new Error(
      "All map servers are temporarily unavailable. Please wait a moment and try again.",
    );
  }

  throw new Error(
    "Could not reach map servers. Please check your connection and try again.",
  );
};

// ============================================
// Main fetch with cache
// ============================================
const fetchPoliceStations = async (lat, lon, radius) => {
  const cacheKey = getCacheKey(lat, lon, radius);

  // ✅ Return cached result if valid (5 minutes)
  if (stationsCache.has(cacheKey)) {
    const cached = stationsCache.get(cacheKey);
    const ageMinutes = (Date.now() - cached.timestamp) / 1000 / 60;
    if (ageMinutes < 5) {
      console.log(
        `📦 Using cached stations (${ageMinutes.toFixed(1)} min old)`,
      );
      return cached.data;
    }
    stationsCache.delete(cacheKey);
  }

  // ✅ Fetch fresh data
  const results = await fetchFromOverpass(lat, lon, radius);

  // ✅ Cache the result
  stationsCache.set(cacheKey, {
    data: results,
    timestamp: Date.now(),
  });

  return results;
};

// ============================================
// Main Component
// ============================================
const PoliceStations = () => {
  const [userPosition, setUserPosition] = useState(null);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);
  const [stationsError, setStationsError] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchRadius, setSearchRadius] = useState(5000);

  // ============================================
  // Get GPS location
  // ============================================
  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("location_unsupported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve([pos.coords.latitude, pos.coords.longitude]),
        (err) => {
          switch (err.code) {
            case err.PERMISSION_DENIED:
              reject(new Error("location_denied"));
              break;
            case err.POSITION_UNAVAILABLE:
              reject(new Error("location_unavailable"));
              break;
            case err.TIMEOUT:
              reject(new Error("location_timeout"));
              break;
            default:
              reject(new Error("location_unknown"));
          }
        },
        { enableHighAccuracy: true, timeout: 15000 },
      );
    });
  };

  // ============================================
  // Load data
  // ============================================
  const loadData = async (silent = false, radiusOverride = null) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    setLocationError(false);
    setStationsError(null);

    const activeRadius = radiusOverride ?? searchRadius;

    // ✅ Reuse existing position - dont re-ask GPS
    let position = userPosition;

    if (!position) {
      try {
        position = await getUserLocation();
        setUserPosition(position);
      } catch (error) {
        setLocationError(true);
        setLoading(false);
        setRefreshing(false);

        const msg = error.message;
        if (msg === "location_denied") {
          toast.error(
            "Location access denied. Please enable GPS in browser settings.",
          );
        } else if (msg === "location_unavailable") {
          toast.error("Location unavailable. Please check your GPS signal.");
        } else if (msg === "location_timeout") {
          toast.error("Location timed out. Please try again.");
        } else if (msg === "location_unsupported") {
          toast.error("Your browser does not support location services.");
        } else {
          toast.error("Could not get your location. Please try again.");
        }
        return;
      }
    }

    toast.loading("Finding nearby police stations...", {
      id: "police-loading",
    });

    try {
      const stationsData = await fetchPoliceStations(
        position[0],
        position[1],
        activeRadius,
      );

      const stationsWithDistance = stationsData
        .map((station) => ({
          ...station,
          distance: calculateDistance(
            position[0],
            position[1],
            station.lat,
            station.lon,
          ),
        }))
        .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

      setStations(stationsWithDistance);
      setStationsError(null);

      if (stationsWithDistance.length === 0) {
        toast.error(
          `No police stations found within ${activeRadius / 1000}km. Try a larger radius.`,
          { id: "police-loading", duration: 5000 },
        );
      } else {
        toast.success(
          `Found ${stationsWithDistance.length} police stations nearby`,
          { id: "police-loading" },
        );
        setSelectedStation(stationsWithDistance[0]);
      }
    } catch (error) {
      console.error("Stations fetch failed:", error.message);
      setStationsError(error.message);
      setStations([]);
      toast.error(
        error.message || "Could not load police stations. Please try again.",
        { id: "police-loading", duration: 5000 },
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ============================================
  // Handle call
  // ============================================
  const handleCall = (phone, stationName) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      toast(
        (t) => (
          <div className="flex flex-col gap-2">
            <p className="font-bold text-sm">📞 Call Police</p>
            <p className="text-xs text-gray-600">
              No direct number found for {stationName}
            </p>
            <div className="flex gap-2">
              <a
                href="tel:100"
                onClick={() => toast.dismiss(t.id)}
                className="flex-1 text-center px-3 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg"
              >
                Call 100 (Police)
              </a>
              <a
                href="tel:112"
                onClick={() => toast.dismiss(t.id)}
                className="flex-1 text-center px-3 py-2 bg-red-500 text-white text-xs font-bold rounded-lg"
              >
                Call 112 (Emergency)
              </a>
            </div>
          </div>
        ),
        { duration: 8000 },
      );
    }
  };

  // ============================================
  // Handle directions
  // ============================================
  const handleDirections = (station) => {
    window.open(
      `https://maps.google.com/?q=${station.lat},${station.lon}&mode=driving`,
      "_blank",
    );
  };

  // ============================================
  // Render
  // ============================================
  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A2E]">
              Nearest Police Stations
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {stations.length > 0
                ? `${stations.length} stations found within ${searchRadius / 1000}km`
                : userPosition
                  ? "Search for nearby police stations"
                  : "Getting your location..."}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={searchRadius}
              onChange={(e) => {
                const newRadius = Number(e.target.value);
                setSearchRadius(newRadius);
                // ✅ Pass radius directly - no stale state
                loadData(true, newRadius);
              }}
              className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:outline-none focus:border-[#E91E8C]"
            >
              <option value={2000}>2 km</option>
              <option value={5000}>5 km</option>
              <option value={10000}>10 km</option>
              <option value={20000}>20 km</option>
            </select>

            <button
              onClick={() => loadData(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 text-gray-600 rounded-xl hover:border-[#E91E8C] hover:text-[#E91E8C] transition-all text-sm font-medium disabled:opacity-50"
            >
              <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <a
              href="tel:112"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm"
            >
              <FiPhone /> Call 112
            </a>
          </div>
        </div>

        {/* Emergency Numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              number: "112",
              label: "Emergency",
              color: "from-red-500 to-red-600",
            },
            {
              number: "100",
              label: "Police",
              color: "from-blue-500 to-blue-600",
            },
            {
              number: "1091",
              label: "Women Helpline",
              color: "from-pink-500 to-pink-600",
            },
            {
              number: "1098",
              label: "Child Helpline",
              color: "from-purple-500 to-purple-600",
            },
          ].map((item) => (
            <a
              key={item.number}
              href={`tel:${item.number}`}
              className={`bg-gradient-to-r ${item.color} rounded-2xl p-4 text-center text-white hover:shadow-lg transition-all hover:-translate-y-1 active:translate-y-0`}
            >
              <p className="text-2xl font-bold">{item.number}</p>
              <p className="text-xs font-medium opacity-90 mt-1">
                {item.label}
              </p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <FiPhone className="text-xs" />
                <span className="text-xs">Tap to Call</span>
              </div>
            </a>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 font-medium">
                {!userPosition
                  ? "Getting your location..."
                  : "Finding police stations..."}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {!userPosition
                  ? "Please allow location access"
                  : "This may take a few seconds"}
              </p>
            </div>
          </div>
        )}

        {/* Location Error - full page */}
        {!loading && locationError && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <FiAlertCircle className="text-5xl text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">
              Location Access Required
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Please enable location access in your browser settings to find
              nearby police stations.
            </p>
            <button
              onClick={() => {
                setLocationError(false);
                loadData();
              }}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Main Content - always shows if location available */}
        {!loading && !locationError && userPosition && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Station List */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-sm font-bold text-[#1A1A2E]">
                Nearby Stations ({stations.length})
              </h3>

              {/* Stations error - inline, map still shows */}
              {stationsError && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-center">
                  <MdLocalPolice className="text-4xl text-orange-400 mx-auto mb-2" />
                  <p className="text-orange-700 font-semibold text-sm mb-1">
                    Could Not Load Stations
                  </p>
                  <p className="text-orange-600 text-xs mb-3">
                    Map servers are busy. Your location is shown on the map.
                  </p>
                  <button
                    onClick={() => loadData(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 mx-auto px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 disabled:opacity-60"
                  >
                    <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
                    Try Again
                  </button>
                </div>
              )}

              {/* Empty */}
              {!stationsError && stations.length === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                  <MdLocalPolice className="text-5xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    No stations found within {searchRadius / 1000}km
                  </p>
                  <button
                    onClick={() => {
                      setSearchRadius(20000);
                      loadData(true, 20000);
                    }}
                    className="mt-3 text-blue-500 text-sm font-semibold hover:underline"
                  >
                    Try 20km radius
                  </button>
                </div>
              )}

              {/* Station cards */}
              {stations.length > 0 && (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {stations.map((station, index) => (
                    <div
                      key={station.id}
                      onClick={() => setSelectedStation(station)}
                      className={`bg-white rounded-2xl p-4 border-2 cursor-pointer transition-all ${
                        selectedStation?.id === station.id
                          ? "border-blue-500 shadow-md shadow-blue-100"
                          : "border-gray-100 hover:border-blue-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-sm ${
                            index === 0
                              ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                              : "bg-gradient-to-br from-blue-400 to-blue-600"
                          }`}
                        >
                          {index === 0 ? "⭐" : index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-[#1A1A2E] text-sm leading-tight">
                              {station.name}
                            </p>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex-shrink-0">
                              {station.distance} km
                            </span>
                          </div>

                          {station.address && (
                            <p className="text-gray-400 text-xs mt-0.5 truncate">
                              📍 {station.address}
                            </p>
                          )}

                          {index === 0 && (
                            <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                              ⭐ Nearest
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCall(station.phone, station.name);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500 text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition-colors"
                        >
                          <FiPhone className="text-sm" /> Call
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDirections(station);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-50 text-green-600 text-xs font-bold rounded-xl hover:bg-green-100 transition-colors"
                        >
                          <MdDirections className="text-sm" /> Directions
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Map */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Map Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#1A1A2E] text-sm">
                      {selectedStation
                        ? `🚔 ${selectedStation.name}`
                        : "📍 Your Location"}
                    </p>
                    {selectedStation && (
                      <p className="text-gray-400 text-xs mt-0.5">
                        {selectedStation.distance} km away
                      </p>
                    )}
                  </div>
                  {selectedStation && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleCall(
                            selectedStation.phone,
                            selectedStation.name,
                          )
                        }
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition-colors"
                      >
                        <FiPhone /> Call Station
                      </button>
                      <button
                        onClick={() => handleDirections(selectedStation)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-600 transition-colors"
                      >
                        <MdDirections /> Directions
                      </button>
                    </div>
                  )}
                </div>

                {/* Map */}
                <MapContainer
                  center={userPosition}
                  zoom={14}
                  scrollWheelZoom={true}
                  className="h-[450px] sm:h-[500px] w-full"
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapUpdater
                    position={
                      selectedStation
                        ? [selectedStation.lat, selectedStation.lon]
                        : userPosition
                    }
                  />
                  <Circle
                    center={userPosition}
                    radius={searchRadius}
                    pathOptions={{
                      color: "#E91E8C",
                      fillColor: "#E91E8C",
                      fillOpacity: 0.05,
                      weight: 1,
                      dashArray: "5, 5",
                    }}
                  />

                  {/* User marker */}
                  <Marker position={userPosition} icon={createUserIcon()}>
                    <Popup>
                      <div className="text-center">
                        <p style={{ fontWeight: 700, color: "#E91E8C" }}>
                          📍 Your Location
                        </p>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Station markers */}
                  {stations.map((station, index) => (
                    <Marker
                      key={station.id}
                      position={[station.lat, station.lon]}
                      icon={createPoliceIcon(index === 0)}
                      eventHandlers={{
                        click: () => setSelectedStation(station),
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
                            🚔 {station.name}
                          </p>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              marginBottom: "8px",
                            }}
                          >
                            📍 {station.distance} km away
                          </p>
                          {station.address && (
                            <p
                              style={{
                                fontSize: "11px",
                                color: "#999",
                                marginBottom: "8px",
                              }}
                            >
                              {station.address}
                            </p>
                          )}
                          <div style={{ display: "flex", gap: "8px" }}>
                            <a
                              href={
                                station.phone
                                  ? `tel:${station.phone}`
                                  : "tel:100"
                              }
                              style={{
                                flex: 1,
                                textAlign: "center",
                                padding: "8px",
                                background: "#1976D2",
                                color: "white",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: 700,
                                textDecoration: "none",
                              }}
                            >
                              📞 Call
                            </a>
                            <a
                              href={`https://maps.google.com/?q=${station.lat},${station.lon}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                flex: 1,
                                textAlign: "center",
                                padding: "8px",
                                background: "#4CAF50",
                                color: "white",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: 700,
                                textDecoration: "none",
                              }}
                            >
                              🗺 Maps
                            </a>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>

                {/* Stations error banner below map */}
                {stationsError && (
                  <div className="p-4 bg-orange-50 border-t border-orange-100 flex items-center gap-3">
                    <FiAlertCircle className="text-orange-500 text-xl flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-orange-700 text-sm font-semibold">
                        Station data unavailable
                      </p>
                      <p className="text-orange-600 text-xs">
                        Your location is shown. Station servers are temporarily
                        busy.
                      </p>
                    </div>
                    <button
                      onClick={() => loadData(true)}
                      disabled={refreshing}
                      className="flex-shrink-0 px-3 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 disabled:opacity-60"
                    >
                      <FiRefreshCw
                        className={refreshing ? "animate-spin" : ""}
                      />
                    </button>
                  </div>
                )}

                {/* Selected station info bar */}
                {selectedStation && !stationsError && (
                  <div className="p-4 bg-blue-50 border-t border-blue-100">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <MdLocalPolice className="text-blue-500 text-xl" />
                        <div>
                          <p className="font-bold text-[#1A1A2E] text-sm">
                            {selectedStation.name}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {selectedStation.distance} km from you
                          </p>
                        </div>
                      </div>
                      <a
                        href={
                          selectedStation.phone
                            ? `tel:${selectedStation.phone}`
                            : "tel:100"
                        }
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition-colors"
                      >
                        <FiPhone />
                        {selectedStation.phone || "100"}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PoliceStations;
