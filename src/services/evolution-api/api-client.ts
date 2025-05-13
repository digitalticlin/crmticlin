
import { MAX_RETRIES, RETRY_DELAY } from "./config";

/**
 * Class to handle HTTP requests with Evolution API
 */
export class ApiClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;

    // Validate API URL and key
    if (!apiUrl || apiUrl.trim() === "") {
      console.error("Invalid API URL provided");
    }
    
    if (!apiKey || apiKey.trim() === "") {
      console.error("Invalid API key provided");
    }
  }

  /**
   * Performs HTTP requests with standard headers for the API with retry logic
   */
  async fetchWithHeaders(endpoint: string, options: RequestInit = {}, retries = 0): Promise<any> {
    const headers = {
      "Content-Type": "application/json",
      "apikey": this.apiKey,
      ...options.headers
    };

    try {
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP error: ${response.status} ${response.statusText}`
        }));
        
        const errorMessage = errorData?.error || `Error with request: ${response.status}`;
        console.error(`API error on ${endpoint}:`, errorMessage);
        
        // Implement retry logic for server errors (5xx)
        if (retries < MAX_RETRIES && response.status >= 500) {
          console.log(`Retrying request to ${endpoint} (attempt ${retries + 1} of ${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return this.fetchWithHeaders(endpoint, options, retries + 1);
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      // Only retry network errors or timeouts
      if (retries < MAX_RETRIES && (error.name === "TypeError" || error.name === "AbortError")) {
        console.log(`Network error, retrying request to ${endpoint} (attempt ${retries + 1} of ${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return this.fetchWithHeaders(endpoint, options, retries + 1);
      }
      
      console.error(`Failed request to ${endpoint} after ${retries} retries:`, error);
      throw error;
    }
  }
}
