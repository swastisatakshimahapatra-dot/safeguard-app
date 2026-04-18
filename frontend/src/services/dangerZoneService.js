const API_TIMEOUT = 8000;

// ✅ Calculate if point is inside circle
export const isPointInCircle = (
  pointLat,
  pointLon,
  circleLat,
  circleLon,
  radiusMeters,
) => {
  const R = 6371000;
  const dLat = ((circleLat - pointLat) * Math.PI) / 180;
  const dLon = ((circleLon - pointLon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((pointLat * Math.PI) / 180) *
      Math.cos((circleLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c <= radiusMeters;
};

// ✅ Get time-based risk
export const getTimeBasedRisk = (zone) => {
  if (!zone.activeHours) return zone.risk;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMin] = zone.activeHours.start.split(":").map(Number);
  const [endHour, endMin] = zone.activeHours.end.split(":").map(Number);
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  let isInDangerTime;
  if (startTime > endTime) {
    isInDangerTime = currentTime >= startTime || currentTime <= endTime;
  } else {
    isInDangerTime = currentTime >= startTime && currentTime <= endTime;
  }

  if (isInDangerTime) return zone.risk;
  if (zone.risk === "high") return "medium";
  if (zone.risk === "medium") return "low";
  return "low";
};

// ✅ Hardcoded fallback zones
const getHardcodedZones = (userLat, userLon) => [
  {
    id: "hz1",
    name: "Old Railway Station Area",
    latitude: userLat + 0.02,
    longitude: userLon + 0.01,
    radius: 500,
    risk: "high",
    reason: "Poorly lit, isolated area at night",
    activeHours: { start: "18:00", end: "06:00" },
    description: "Low foot traffic after dark, limited police patrolling",
  },
  {
    id: "hz2",
    name: "Highway Bypass Road",
    latitude: userLat - 0.01,
    longitude: userLon - 0.02,
    radius: 800,
    risk: "medium",
    reason: "Fast-moving traffic, limited pedestrian access",
    description: "Few emergency exits, isolated stretches",
  },
  {
    id: "hz3",
    name: "Industrial Zone",
    latitude: userLat + 0.015,
    longitude: userLon - 0.01,
    radius: 600,
    risk: "high",
    reason: "Deserted after working hours",
    activeHours: { start: "18:00", end: "08:00" },
    description: "Low visibility, few people around",
  },
  {
    id: "hz4",
    name: "Old Market Complex",
    latitude: userLat - 0.015,
    longitude: userLon + 0.015,
    radius: 400,
    risk: "medium",
    reason: "Crowded with narrow lanes",
    activeHours: { start: "20:00", end: "07:00" },
    description: "Maze-like structure, difficult navigation at night",
  },
  {
    id: "hz5",
    name: "Riverbank Park",
    latitude: userLat + 0.01,
    longitude: userLon - 0.02,
    radius: 700,
    risk: "high",
    reason: "Isolated location, poor lighting",
    activeHours: { start: "19:00", end: "06:00" },
    description: "Limited security, away from residential areas",
  },
  {
    id: "hz6",
    name: "Construction Site Zone",
    latitude: userLat - 0.008,
    longitude: userLon - 0.008,
    radius: 350,
    risk: "medium",
    reason: "Ongoing construction, debris hazards",
    description: "Uneven surfaces, limited security",
  },
  {
    id: "hz7",
    name: "Underpass Tunnel",
    latitude: userLat + 0.005,
    longitude: userLon + 0.025,
    radius: 300,
    risk: "high",
    reason: "Enclosed space, poor lighting",
    activeHours: { start: "17:00", end: "08:00" },
    description: "Limited visibility, echo effect makes it unsafe",
  },
  {
    id: "hz8",
    name: "Bus Depot Area",
    latitude: userLat + 0.025,
    longitude: userLon - 0.015,
    radius: 450,
    risk: "medium",
    reason: "High crowd density, pickpocketing risk",
    description: "Congested area with transient population",
  },
];

// ✅ Fetch from OpenStreetMap
const fetchFromOpenStreetMap = async (lat, lon, radius = 5000) => {
  const query = `
      [out:json][timeout:8];
      (
        way["highway"="unclassified"]["lit"="no"](around:${radius},${lat},${lon});
        way["landuse"="railway"](around:${radius},${lat},${lon});
        way["landuse"="industrial"](around:${radius},${lat},${lon});
        node["amenity"="bus_station"](around:${radius},${lat},${lon});
      );
      out body;
      >;
      out skel qt;
    `;

  const response = await Promise.race([
    fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
    ),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), API_TIMEOUT),
    ),
  ]);

  if (!response.ok) throw new Error("Overpass failed");

  const data = await response.json();
  const zones = [];
  const processed = new Set();

  data.elements.forEach((element) => {
    if (processed.has(element.id)) return;
    processed.add(element.id);

    let zoneLat, zoneLon, risk, name, reason;

    if (element.type === "node") {
      zoneLat = element.lat;
      zoneLon = element.lon;
    } else if (element.type === "way" && element.center) {
      zoneLat = element.center.lat;
      zoneLon = element.center.lon;
    } else return;

    if (
      element.tags?.highway === "unclassified" &&
      element.tags?.lit === "no"
    ) {
      risk = "high";
      name = "Poorly Lit Street";
      reason = "No street lighting";
    } else if (element.tags?.landuse === "railway") {
      risk = "high";
      name = "Railway Area";
      reason = "Isolated railway zone";
    } else if (element.tags?.landuse === "industrial") {
      risk = "medium";
      name = "Industrial Zone";
      reason = "Low activity after hours";
    } else if (element.tags?.amenity === "bus_station") {
      risk = "medium";
      name = "Bus Station Area";
      reason = "High crowd density";
    } else return;

    zones.push({
      id: `osm_${element.id}`,
      name: element.tags?.name || name,
      latitude: zoneLat,
      longitude: zoneLon,
      radius: 400,
      risk,
      reason,
      description: "Identified from OpenStreetMap data",
      activeHours:
        risk === "high" ? { start: "18:00", end: "06:00" } : undefined,
    });
  });

  return zones.length > 0 ? zones : null;
};

// ✅ MAIN FUNCTION
export const getDangerZones = async (userLat, userLon) => {
  console.log("🔍 Fetching danger zones...");

  // Try OpenStreetMap first
  try {
    console.log("Trying OpenStreetMap...");
    const osmData = await fetchFromOpenStreetMap(userLat, userLon);
    if (osmData && osmData.length > 0) {
      console.log("✅ Got", osmData.length, "zones from OpenStreetMap");
      return osmData;
    }
  } catch (error) {
    console.log("OpenStreetMap not available:", error.message);
  }

  // Fallback
  console.log("⚠️ Using fallback hardcoded zones");
  return getHardcodedZones(userLat, userLon);
};

// ✅ Check if user is in danger zone
export const checkUserInDangerZone = (userLat, userLon, zones) => {
  for (const zone of zones) {
    const currentRisk = getTimeBasedRisk(zone);
    if (
      isPointInCircle(
        userLat,
        userLon,
        zone.latitude,
        zone.longitude,
        zone.radius,
      )
    ) {
      return { isInDanger: true, zone: { ...zone, currentRisk } };
    }
  }
  return { isInDanger: false, zone: null };
};

// ✅ Get risk colors
export const getRiskColor = (risk) => {
  switch (risk) {
    case "high":
      return {
        border: "#dc2626",
        fill: "rgba(220, 38, 38, 0.2)",
        text: "text-red-600",
        bg: "bg-red-100",
      };
    case "medium":
      return {
        border: "#f59e0b",
        fill: "rgba(245, 158, 11, 0.2)",
        text: "text-yellow-600",
        bg: "bg-yellow-100",
      };
    default:
      return {
        border: "#10b981",
        fill: "rgba(16, 185, 129, 0.2)",
        text: "text-green-600",
        bg: "bg-green-100",
      };
  }
};

// ✅ Get safe route URL
export const getSafeRouteURL = (fromLat, fromLon, toLat, toLon) => {
  return `https://maps.google.com/maps?saddr=${fromLat},${fromLon}&daddr=${toLat},${toLon}&mode=walking`;
};
