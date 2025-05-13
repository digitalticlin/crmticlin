
import { ApiClient } from "./api-client";

/**
 * Service to handle WhatsApp chat operations
 */
export class ChatService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Retrieve all chats for a WhatsApp instance
   */
  async findChats(instanceName: string): Promise<any[]> {
    try {
      console.log(`Retrieving chats for instance: ${instanceName}`);
      const endpoint = `/chat/findChats/${instanceName}`;
      const response = await this.apiClient.fetchWithHeaders(endpoint, {
        method: "POST"
      });
      
      if (!response || !Array.isArray(response)) {
        console.error("Invalid response format for findChats:", response);
        return [];
      }
      
      return response;
    } catch (error) {
      console.error("Error fetching chats:", error);
      return [];
    }
  }

  /**
   * Retrieve messages for a specific chat
   */
  async findMessages(instanceName: string, remoteJid?: string): Promise<any[]> {
    try {
      console.log(`Retrieving messages for instance: ${instanceName}, chat: ${remoteJid || 'all'}`);
      const endpoint = `/chat/findMessages/${instanceName}`;
      
      // Prepare request body if remoteJid is provided
      const options: RequestInit = {
        method: "POST"
      };
      
      if (remoteJid) {
        options.body = JSON.stringify({ number: remoteJid });
      }
      
      const response = await this.apiClient.fetchWithHeaders(endpoint, options);
      
      if (!response || !Array.isArray(response)) {
        console.error("Invalid response format for findMessages:", response);
        return [];
      }
      
      return response;
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  }

  /**
   * Send a text message to a WhatsApp contact
   */
  async sendMessage(instanceName: string, phoneNumber: string, text: string): Promise<any> {
    try {
      console.log(`Sending message to ${phoneNumber} from instance: ${instanceName}`);
      const endpoint = `/message/sendText/${instanceName}`;
      
      // Format phone number (remove + and any spaces)
      const formattedPhone = phoneNumber.replace(/\+|\s/g, '');
      
      const response = await this.apiClient.fetchWithHeaders(endpoint, {
        method: "POST",
        body: JSON.stringify({
          number: formattedPhone,
          text: text,
          textMessage: { text }
        })
      });
      
      if (!response || !response.key) {
        throw new Error("Invalid response format from send message API");
      }
      
      return response;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  /**
   * Check connection status of a WhatsApp instance
   */
  async checkConnectionStatus(instanceName: string): Promise<"connected" | "connecting" | "disconnected"> {
    try {
      console.log(`Checking connection status for instance: ${instanceName}`);
      const endpoint = `/instance/connectionState/${instanceName}`;
      
      const response = await this.apiClient.fetchWithHeaders(endpoint, {
        method: "GET"
      });
      
      if (!response || typeof response.state !== 'string') {
        console.error("Invalid response format for connection status:", response);
        return "disconnected";
      }
      
      return response.state as "connected" | "connecting" | "disconnected";
    } catch (error) {
      console.error("Error checking connection status:", error);
      return "disconnected";
    }
  }

  /**
   * Generate or refresh QR code for an instance
   */
  async connectInstance(instanceName: string): Promise<string | null> {
    try {
      console.log(`Generating QR code for instance: ${instanceName}`);
      const endpoint = `/instance/connect/${instanceName}`;
      
      const response = await this.apiClient.fetchWithHeaders(endpoint, {
        method: "GET"
      });
      
      if (!response || !response.qrcode || !response.qrcode.base64) {
        console.error("Invalid response format for QR code generation:", response);
        return null;
      }
      
      return response.qrcode.base64;
    } catch (error) {
      console.error("Error generating QR code:", error);
      return null;
    }
  }
}
