import api from "./api.js";

// ✅ Trigger panic alert
export const triggerEmergencyAlert = async (locationData) => {
  const response = await api.post("/alert/trigger", locationData);
  return response.data;
};

// ✅ Get own alert history (Tab 1)
export const fetchAlertHistory = async () => {
  const response = await api.get("/alert/history");
  return response.data;
};

// ✅ Delete own alert
export const deleteOwnAlert = async (alertId) => {
  const response = await api.delete(`/alert/delete/${alertId}`);
  return response.data;
};

// ✅ Get family alerts (for family dashboard)
export const fetchFamilyAlerts = async () => {
  const response = await api.get("/alert/family");
  return response.data;
};

// ✅ Get unseen nearby alerts (for dashboard banner)
export const fetchUnseenNearbyAlerts = async () => {
  const response = await api.get("/nearby-alerts/unseen");
  return response.data;
};

// ✅ Get nearby alert history (Tab 2)
export const fetchNearbyAlertHistory = async () => {
  const response = await api.get("/nearby-alerts/history");
  return response.data;
};

// ✅ Mark nearby alert as seen
export const markNearbyAlertAsSeen = async (nearbyAlertId) => {
  const response = await api.put(`/nearby-alerts/mark-seen/${nearbyAlertId}`);
  return response.data;
};

// ✅ Take helper action
export const submitHelperAction = async (data) => {
  const response = await api.post("/nearby-alerts/helper-action", data);
  return response.data;
};

// ✅ Delete from nearby alert history
export const deleteNearbyAlertFromHistory = async (historyId) => {
  const response = await api.delete(`/nearby-alerts/history/${historyId}`);
  return response.data;
};

// ✅ Get helper actions for a specific alert (victim view)
export const fetchHelperActions = async (alertId) => {
  const response = await api.get(`/nearby-alerts/helpers/${alertId}`);
  return response.data;
};
