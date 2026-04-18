import api from "./api.js";

export const registerUser = async (data) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

export const loginUser = async (data) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get("/auth/profile");
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put("/auth/profile", data);
  return response.data;
};

export const changePassword = async (data) => {
  const response = await api.put("/auth/change-password", data);
  return response.data;
};

export const updateSettings = async (settings) => {
  const response = await api.put("/auth/settings", { settings });
  return response.data;
};

export const clearAlertHistory = async () => {
  const response = await api.delete("/auth/clear-alerts");
  return response.data;
};

export const deleteAccount = async () => {
  const response = await api.delete("/auth/delete-account");
  return response.data;
};

// ✅ Family services
export const getLinkedUsers = async () => {
  const response = await api.get("/auth/linked-users");
  return response.data;
};

export const linkUser = async (data) => {
  const response = await api.post("/auth/link-user", data);
  return response.data;
};

export const unlinkUser = async (userId) => {
  const response = await api.delete(`/auth/unlink-user/${userId}`);
  return response.data;
};

export const sendLinkRequest = async (data) => {
  const response = await api.post("/auth/link-request/send", data);
  return response.data;
};

export const getPendingRequests = async () => {
  const response = await api.get("/auth/link-request/pending");
  return response.data;
};

export const getSentRequests = async () => {
  const response = await api.get("/auth/link-request/sent");
  return response.data;
};

export const respondToLinkRequest = async (data) => {
  const response = await api.post("/auth/link-request/respond", data);
  return response.data;
};

export const sendVerificationEmail = async (data) => {
  const response = await api.post("/auth/send-verification", data);
  return response.data;
};

// ✅ ADD THIS - was missing
export const checkEmailExists = async (email) => {
  const response = await api.post("/auth/check-email", { email });
  return response.data;
};