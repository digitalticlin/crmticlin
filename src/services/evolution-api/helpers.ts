
import { EvolutionInstance } from "./types";
import { toast } from "sonner";

/**
 * Generates a unique name based on existing instances
 * Uses sequential numbering like baseName1, baseName2, etc.
 */
export function generateUniqueNameFromExisting(baseName: string, instances: EvolutionInstance[]): string {
  const existingNames = instances.map(instance => instance.instanceName);
  
  console.log(`Checking if "${baseName}" already exists among ${existingNames.length} instances`);
  
  // Check if the base name is already unique
  if (!existingNames.includes(baseName)) {
    console.log(`Base name "${baseName}" is unique, using it`);
    return baseName;
  }
  
  // If already exists, add a sequential number
  return appendSequentialNumber(baseName, existingNames);
}

/**
 * Adds a sequential number to the base name until it finds a unique name
 */
export function appendSequentialNumber(baseName: string, existingNames: string[]): string {
  let counter = 1;
  let newName = `${baseName}${counter}`;
  
  console.log(`Base name "${baseName}" exists, finding next available number`);
  
  while (existingNames.includes(newName)) {
    counter++;
    newName = `${baseName}${counter}`;
  }
  
  console.log(`Generated unique name: "${newName}"`);
  return newName;
}

/**
 * Standard API error handler with toast notifications
 */
export function handleApiError(error: any, message: string, showToast: boolean = true): void {
  // Extract more specific error information if available
  const errorMessage = error?.message || "Erro desconhecido";
  
  console.error(`${message}: ${errorMessage}`, error);
  
  if (showToast) {
    toast.error(`${message}. ${errorMessage}`);
  }
}

/**
 * Maps API response to EvolutionInstance format
 */
export function mapInstanceResponse(data: any): EvolutionInstance {
  return {
    instanceName: data.instance.instanceName,
    instanceId: data.instance.instanceId,
    integration: data.instance.integration,
    status: data.instance.status,
    qrcode: data.qrcode
  };
}

/**
 * Validates the QR Code response
 */
export function validateQrCodeResponse(data: any): void {
  if (!data || !data.qrcode || !data.qrcode.base64) {
    throw new Error("QR Code não disponível na resposta da API");
  }
}
