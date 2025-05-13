
/**
 * Configuration for the Evolution API service
 * These values can be overridden via the admin configuration panel
 */

// Base API URL
export const API_URL = "https://api.evolution.com";

// API authentication key
export const API_KEY = "your-api-key";

// Maximum number of retry attempts for failed requests
export const MAX_RETRIES = 3;

// Delay between retry attempts in milliseconds
export const RETRY_DELAY = 2000;

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000;

// Cache time-to-live in milliseconds (5 minutes)
export const CACHE_TTL = 300000;

/**
 * Loads configuration from environment or admin settings
 */
export const loadConfig = async () => {
  try {
    // This would ideally load from a central configuration service
    // For now, we return the default values
    return {
      API_URL,
      API_KEY,
      MAX_RETRIES,
      RETRY_DELAY,
      REQUEST_TIMEOUT,
      CACHE_TTL
    };
  } catch (error) {
    console.error("Failed to load configuration:", error);
    // Return defaults if loading fails
    return {
      API_URL,
      API_KEY,
      MAX_RETRIES,
      RETRY_DELAY,
      REQUEST_TIMEOUT,
      CACHE_TTL
    };
  }
};

/**
 * Get production-ready configuration
 * This would check if we're in a production environment
 */
export const isProduction = () => {
  // Check if we're in production mode
  // This could be based on environment variables or other indicators
  const hostname = window.location.hostname;
  return !(
    hostname === 'localhost' || 
    hostname === '127.0.0.1' || 
    hostname.includes('staging') || 
    hostname.includes('dev')
  );
};
