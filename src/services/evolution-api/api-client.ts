
import { MAX_RETRIES, RETRY_DELAY, API_KEY } from "./config";

/**
 * Class to handle HTTP requests with Evolution API
 */
export class ApiClient {
  private apiUrl: string;
  private apiKey: string;
  private requestQueue: Map<string, Promise<any>> = new Map();

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
    
    console.log(`ApiClient initialized with URL: ${apiUrl}`);
    // Log partial API KEY for debugging (only first and last 4 characters)
    console.log(`Using API key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
  }

  /**
   * Performs HTTP requests with standard headers for the API with retry logic
   * and request deduplication
   */
  async fetchWithHeaders(endpoint: string, options: RequestInit = {}, retries = 0): Promise<any> {
    // Create a unique key for this request to deduplicate identical calls
    const requestKey = `${options.method || 'GET'}-${endpoint}-${options.body || ''}`;
    
    // If an identical request is already in progress, return that promise instead of making a new request
    if (this.requestQueue.has(requestKey)) {
      console.log(`Request to ${endpoint} already in progress, reusing existing promise`);
      return this.requestQueue.get(requestKey);
    }
    
    // Create headers with API key
    const headers = {
      "Content-Type": "application/json",
      "apikey": this.apiKey,
      ...options.headers
    };

    const url = `${this.apiUrl}${endpoint}`;
    console.log(`Making API request to: ${url}`, {
      method: options.method || 'GET',
    });
    
    // Debug log to verify API key is being sent correctly
    console.log(`Request using API key: ${this.apiKey.substring(0, 4)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
    
    if (options.body) {
      console.log("Request body:", options.body);
    }

    // Create the promise for this request
    const requestPromise = (async () => {
      try {
        console.log(`Executing fetch to ${url} with method ${options.method || 'GET'}`);
        const response = await fetch(url, {
          ...options,
          headers
        });

        console.log(`Response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          let errorMessage;
          try {
            const errorData = await response.json();
            console.log("Error response body:", errorData);
            errorMessage = errorData?.error || `HTTP error: ${response.status} ${response.statusText}`;
          } catch (e) {
            errorMessage = `Error with request: ${response.status}`;
          }
          
          // Detailed logging for auth errors
          if (response.status === 401 || response.status === 403) {
            console.error(`Authentication error (${response.status}) accessing ${endpoint}`);
            console.error(`API Key used: ${this.apiKey.substring(0, 4)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
            errorMessage = `Authentication error: Please verify the API Key is correct (${response.status})`;
          }
          
          console.error(`API error on ${endpoint}:`, errorMessage);
          
          // Implement retry logic for server errors (5xx)
          if (retries < MAX_RETRIES && response.status >= 500) {
            console.log(`Retrying request to ${endpoint} (attempt ${retries + 1} of ${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            // Remove this request from the queue before retrying
            this.requestQueue.delete(requestKey);
            return this.fetchWithHeaders(endpoint, options, retries + 1);
          }
          
          throw new Error(errorMessage);
        }

        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
          console.log("Response data:", data);
        } else {
          const text = await response.text();
          try {
            // Try to parse as JSON anyway
            data = JSON.parse(text);
            console.log("Response parsed as JSON:", data);
          } catch (e) {
            // If it's not JSON, return the text
            console.log("Response is not JSON, returning text");
            data = text;
          }
        }

        return data;
      } catch (error: any) {
        // Only retry network errors or timeouts
        if (retries < MAX_RETRIES && (error.name === "TypeError" || error.name === "AbortError")) {
          console.log(`Network error, retrying request to ${endpoint} (attempt ${retries + 1} of ${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          // Remove this request from the queue before retrying
          this.requestQueue.delete(requestKey);
          return this.fetchWithHeaders(endpoint, options, retries + 1);
        }
        
        console.error(`Failed request to ${endpoint} after ${retries} retries:`, error);
        throw error;
      } finally {
        // Clean up the request queue after a short delay
        // This prevents immediate duplicate requests but allows new ones after a delay
        setTimeout(() => {
          this.requestQueue.delete(requestKey);
        }, 500);
      }
    })();
    
    // Store the promise in the request queue
    this.requestQueue.set(requestKey, requestPromise);
    
    return requestPromise;
  }
}
