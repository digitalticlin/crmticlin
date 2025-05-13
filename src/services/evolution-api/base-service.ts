
import { ApiClient } from "./api-client";

/**
 * Base service class with common functionality
 */
export class BaseService {
  protected apiClient: ApiClient;
  
  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }
  
  /**
   * Standard API error handler with toast notifications
   */
  protected handleOperationError(error: any, operation: string, showToast: boolean = true): void {
    const errorMessage = error?.message || "Unknown error";
    console.error(`Error during ${operation}:`, error);
    
    if (showToast) {
      const { toast } = require("sonner");
      toast.error(`Error: ${errorMessage}`);
    }
  }
}
