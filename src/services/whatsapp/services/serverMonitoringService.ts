
import { VPS_CONFIG } from "../config/vpsConfig";
import { ServiceResponse } from "../types/whatsappWebTypes";

export class ServerMonitoringService {
  static async checkServerHealth(): Promise<ServiceResponse> {
    try {
      const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error || 'Server error'}`);
      }

      return { success: true, data };

    } catch (error) {
      console.error('Error checking server health:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async getServerInfo(): Promise<ServiceResponse> {
    try {
      const response = await fetch(`${VPS_CONFIG.baseUrl}/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error || 'Server error'}`);
      }

      return { success: true, data };

    } catch (error) {
      console.error('Error getting server info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async listInstances(): Promise<ServiceResponse> {
    try {
      const response = await fetch(`${VPS_CONFIG.baseUrl}/instances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error || 'Server error'}`);
      }

      return { success: true, data };

    } catch (error) {
      console.error('Error listing instances:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
