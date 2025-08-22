
export interface WhatsAppInstance {
  id: string;
  instance_name: string;
  connection_status: string;
  web_status: string;
  deviceInfo?: {
    deviceModel?: string;
    batteryLevel?: number;
    whatsappVersion?: string;
    lastConnectionTime?: string;
  };
}

export const useWhatsAppInstanceStore = () => {
  return {
    instances: [] as WhatsAppInstance[],
    selectedInstance: null as WhatsAppInstance | null,
  };
};
