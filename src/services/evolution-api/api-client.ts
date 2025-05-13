
import { MAX_RETRIES, RETRY_DELAY, API_KEY } from "./config";

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
    
    console.log(`ApiClient initialized with URL: ${apiUrl}`);
    // Log parcial da API KEY para debugging (apenas primeiros 4 caracteres)
    console.log(`Using API key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
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

    const url = `${this.apiUrl}${endpoint}`;
    console.log(`Making API request to: ${url}`, {
      method: options.method || 'GET',
    });
    
    // Log para debugging - verificar se a API key está sendo enviada corretamente
    console.log(`Request usando API key: ${this.apiKey.substring(0, 4)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
    
    if (options.body) {
      console.log("Request body:", options.body);
    }

    try {
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
        
        // Log detalhado para depuração de erros de autenticação
        if (response.status === 401 || response.status === 403) {
          console.error(`Erro de autenticação (${response.status}) ao acessar ${endpoint}`);
          console.error(`API Key usada: ${this.apiKey.substring(0, 4)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
          errorMessage = `Erro de autenticação: Verifique se a API Key está correta (${response.status})`;
        }
        
        console.error(`API error on ${endpoint}:`, errorMessage);
        
        // Implement retry logic for server errors (5xx)
        if (retries < MAX_RETRIES && response.status >= 500) {
          console.log(`Retrying request to ${endpoint} (attempt ${retries + 1} of ${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
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
        return this.fetchWithHeaders(endpoint, options, retries + 1);
      }
      
      console.error(`Failed request to ${endpoint} after ${retries} retries:`, error);
      throw error;
    }
  }
}
