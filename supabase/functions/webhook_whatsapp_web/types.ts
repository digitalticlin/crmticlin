
export interface WebhookData {
  event: string;
  instanceName: string;
  data: {
    qrCode?: string;
    messages?: Array<{
      key: {
        id: string;
        remoteJid: string;
        fromMe: boolean;
      };
      message: {
        conversation?: string;
        extendedTextMessage?: {
          text: string;
        };
      };
    }>;
    connection?: {
      state: string;
      isNewLogin?: boolean;
    };
  };
  timestamp: string;
  server_url?: string;
}
