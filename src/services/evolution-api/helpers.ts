
import { toast } from "sonner";
import { isProduction } from "./config";
import type { EvolutionInstance } from "./types";

/**
 * Validates a QR code response from the API
 */
export const validateQrCodeResponse = (data: any): void => {
  if (!data) {
    throw new Error("Resposta nula da API");
  }
  
  if (!data.qrcode || !data.qrcode.base64) {
    throw new Error("QR Code não disponível na resposta");
  }
};

/**
 * Handles API errors with appropriate user feedback
 * @param error The error object
 * @param userMessage A user-friendly message
 * @param showToast Whether to show a toast notification
 * @returns void
 */
export const handleApiError = (error: any, userMessage: string, showToast = true): void => {
  // Log detailed error in development, less details in production
  if (!isProduction()) {
    console.error(`API Error: ${userMessage}`, error);
  } else {
    console.error(`API Error: ${userMessage}`);
  }
  
  // Show toast notification if requested
  if (showToast) {
    toast.error(userMessage);
  }
  
  // Add error tracking for production
  if (isProduction() && typeof window !== "undefined") {
    // This would integrate with an error tracking service like Sentry
    // Example: Sentry.captureException(error);
  }
};

/**
 * Generates a unique instance name if the base name already exists
 * @param baseName The base name to use
 * @param existingInstances Array of existing instances
 * @returns A unique instance name
 */
export const generateUniqueNameFromExisting = (
  baseName: string, 
  existingInstances: EvolutionInstance[]
): string => {
  // Normalize the base name (lowercase, remove special characters)
  const normalizedBase = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  // If no instances exist with this name, return the normalized base name
  const matchingInstances = existingInstances.filter(instance => 
    instance.instanceName && 
    instance.instanceName.toLowerCase().startsWith(normalizedBase)
  );
  
  if (matchingInstances.length === 0) {
    return normalizedBase;
  }
  
  // Find the highest suffix number
  let maxSuffix = 0;
  
  matchingInstances.forEach(instance => {
    if (!instance.instanceName) return;
    
    const suffixMatch = instance.instanceName.match(new RegExp(`^${normalizedBase}(\\d+)$`));
    
    if (suffixMatch && suffixMatch[1]) {
      const suffix = parseInt(suffixMatch[1], 10);
      if (!isNaN(suffix) && suffix > maxSuffix) {
        maxSuffix = suffix;
      }
    }
  });
  
  // Return with incremented suffix
  return `${normalizedBase}${maxSuffix + 1}`;
};

/**
 * Maps API instance response to a standardized format
 */
export const mapInstanceResponse = (data: any): EvolutionInstance => {
  if (!data || !data.instance) {
    throw new Error("Formato de resposta inválido da API");
  }
  
  return {
    instanceName: data.instance.instanceName,
    instanceId: data.instance.instanceId,
    qrcode: data.qrcode,
    status: data.instance.status || 'created'
  };
};

/**
 * Formats phone number to a standardized format
 * @param phoneNumber The phone number to format
 * @returns A formatted phone number
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove non-numeric characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Ensure it doesn't start with a leading 0
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Add default country code if missing (55 for Brazil)
  if (cleaned.length <= 11) {
    cleaned = `55${cleaned}`;
  }
  
  return cleaned;
};

/**
 * Creates a retry policy for API requests
 * @param maxRetries Maximum number of retry attempts
 * @param delayMs Delay between retries in milliseconds
 */
export const createRetryPolicy = (maxRetries: number, delayMs: number) => {
  return async <T>(operation: () => Promise<T>): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't wait on the last attempt
        if (attempt < maxRetries) {
          // Add jitter to prevent synchronized retries
          const jitter = Math.random() * 500;
          await new Promise(resolve => setTimeout(resolve, delayMs + jitter));
        }
      }
    }
    
    throw lastError;
  };
};
