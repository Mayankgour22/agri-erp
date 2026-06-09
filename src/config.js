// Central configuration for Agri ERP System backend URL

// Read backend URL from Vite environment variable VITE_API_URL
// If not defined, default to empty string so relative paths are used (respecting Vite proxy or same-domain deployment)
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
