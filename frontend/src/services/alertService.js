import api from "./api.js";

// ✅ Trigger panic alert
export const triggerEmergencyAlert = async (locationData) => {
  const response = await api.post("/alert/trigger", locationData);
  return response.data;
};

// ✅ Get alert history
export const fetchAlertHistory = async () => {
  const response = await api.get("/alert/history");
  return response.data;
};
