import axios from "axios";

const API_BASE_URL = "http://192.168.1.3:8000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get("/dashboard-stats/"),
};

// Hunters API
export const huntersAPI = {
  getAll: () => api.get("/hunters/hunters/"),
  getById: (id) => api.get(`/hunters/hunters/${id}/`),
  create: (data) => api.post("/hunters/hunters/", data),
  update: (id, data) => api.put(`/hunters/hunters/${id}/`, data),
  delete: (id) => api.delete(`/hunters/hunters/${id}/`),
  getShots: (hunterId = null) =>
    api.get(`/hunters/shots/${hunterId ? `?hunter=${hunterId}` : ""}`),
  getGuns: (ownerId = null) =>
    api.get(`/hunters/guns/${ownerId ? `?owner=${ownerId}` : ""}`),
};

// Guns API
export const gunsAPI = {
  getAll: () => api.get("/hunters/guns/"),
  getById: (id) => api.get(`/hunters/guns/${id}/`),
  create: (data) => api.post("/hunters/guns/", data),
  update: (id, data) => api.put(`/hunters/guns/${id}/`, data),
  delete: (id) => api.delete(`/hunters/guns/${id}/`),
};

// Shots API
export const shotsAPI = {
  getAll: (limit = 50) => api.get(`/hunters/shots/?limit=${limit}`),
  getById: (id) => api.get(`/hunters/shots/${id}/`),
  create: (data) => api.post("/hunters/shots/", data),
  update: (id, data) => api.put(`/hunters/shots/${id}/`, data),
  delete: (id) => api.delete(`/hunters/shots/${id}/`),
  getRecent: (limit = 10) => api.get(`/hunters/shots/?limit=${limit}`),
};

// Ammunition API
export const ammunitionAPI = {
  getInventory: () => api.get("/ammunition/inventory/"),
  getById: (id) => api.get(`/ammunition/inventory/${id}/`),
  create: (data) => api.post("/ammunition/inventory/", data),
  update: (id, data) => api.put(`/ammunition/inventory/${id}/`, data),
  delete: (id) => api.delete(`/ammunition/inventory/${id}/`),
};

// Activities API
export const activitiesAPI = {
  getAll: () => api.get("/activities/activities/"),
  getById: (id) => api.get(`/activities/activities/${id}/`),
  create: (data) => api.post("/activities/activities/", data),
  update: (id, data) => api.put(`/activities/activities/${id}/`, data),
  delete: (id) => api.delete(`/activities/activities/${id}/`),
};

// Compliance API
export const complianceAPI = {
  // Violations
  getViolations: (hunterId = null) =>
    api.get(`/compliance/violations/${hunterId ? `?hunter=${hunterId}` : ""}`),
  getViolationById: (id) => api.get(`/compliance/violations/${id}/`),
  createViolation: (data) => api.post("/compliance/violations/", data),
  updateViolation: (id, data) => api.put(`/compliance/violations/${id}/`, data),
  deleteViolation: (id) => api.delete(`/compliance/violations/${id}/`),
  getRecentViolations: () =>
    api.get("/compliance/violations/recent_violations/"),
  getViolationStats: () => api.get("/compliance/violations/violation_stats/"),

  // Hunting Zones
  getHuntingZones: () => api.get("/compliance/hunting-zones/"),
  getHuntingZoneById: (id) => api.get(`/compliance/hunting-zones/${id}/`),
  createHuntingZone: (data) => api.post("/compliance/hunting-zones/", data),
  updateHuntingZone: (id, data) =>
    api.put(`/compliance/hunting-zones/${id}/`, data),
  deleteHuntingZone: (id) => api.delete(`/compliance/hunting-zones/${id}/`),
  getActiveZones: () => api.get("/compliance/hunting-zones/active_zones/"),

  // Licenses
  getLicenses: (hunterId = null) =>
    api.get(`/compliance/licenses/${hunterId ? `?hunter=${hunterId}` : ""}`),
  getLicenseById: (id) => api.get(`/compliance/licenses/${id}/`),
  createLicense: (data) => api.post("/compliance/licenses/", data),
  updateLicense: (id, data) => api.put(`/compliance/licenses/${id}/`, data),
  deleteLicense: (id) => api.delete(`/compliance/licenses/${id}/`),
  getExpiringSoon: () => api.get("/compliance/licenses/expiring_soon/"),
  getLicenseStats: () => api.get("/compliance/licenses/license_stats/"),

  // Ammunition Purchases
  getAmmunitionPurchases: (hunterId = null) =>
    api.get(
      `/compliance/ammunition-purchases/${
        hunterId ? `?hunter=${hunterId}` : ""
      }`
    ),
  getAmmunitionPurchaseById: (id) =>
    api.get(`/compliance/ammunition-purchases/${id}/`),
  createAmmunitionPurchase: (data) =>
    api.post("/compliance/ammunition-purchases/", data),
  updateAmmunitionPurchase: (id, data) =>
    api.put(`/compliance/ammunition-purchases/${id}/`, data),
  deleteAmmunitionPurchase: (id) =>
    api.delete(`/compliance/ammunition-purchases/${id}/`),
  getPurchaseStats: () =>
    api.get("/compliance/ammunition-purchases/purchase_stats/"),
  getAmmoPurchaseViolations: () =>
    api.get("/compliance/ammunition-purchases/violations/"),
};

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default api;
