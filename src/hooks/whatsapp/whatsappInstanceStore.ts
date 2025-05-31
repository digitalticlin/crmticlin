
import { create } from 'zustand';

export interface WhatsAppInstance {
  id: string;
  instanceName: string;
  connected: boolean;
  qrCodeUrl?: string;
  phoneNumber?: string;
  phone: string;
  connection_status?: string;
  connection_type: 'web';
  server_url?: string;
  vps_instance_id?: string;
  web_status?: string;
  qr_code?: string;
  owner_jid?: string;
  profile_name?: string;
  profile_pic_url?: string;
  client_name?: string;
  date_connected?: string;
  date_disconnected?: string;
  created_at?: string;
  updated_at?: string;
  session_data?: any;
  // Device information fields
  deviceInfo?: {
    batteryLevel?: number;
    deviceModel?: string;
    whatsappVersion?: string;
    lastConnectionTime?: string;
    platformType?: string;
  };
}

interface WhatsAppInstanceState {
  instances: WhatsAppInstance[];
  isLoading: Record<string, boolean>;
  lastError: string | null;
  setInstances: (instances: WhatsAppInstance[]) => void;
}

interface WhatsAppInstanceActions {
  setLoading: (instanceId: string, isLoading: boolean) => void;
  setError: (error: string | null) => void;
  updateInstance: (instanceId: string, instance: Partial<WhatsAppInstance>) => void;
}

const useWhatsAppInstanceStore = create<WhatsAppInstanceState & { actions: WhatsAppInstanceActions }>((set) => ({
  instances: [],
  isLoading: {},
  lastError: null,
  setInstances: (instances) => set({ instances }),
  actions: {
    setLoading: (instanceId, isLoading) => set((state) => ({
      isLoading: { ...state.isLoading, [instanceId]: isLoading }
    })),
    setError: (error) => set({ lastError: error }),
    updateInstance: (instanceId, updatedInstance) => set((state) => ({
      instances: state.instances.map(instance => 
        instance.id === instanceId ? { ...instance, ...updatedInstance } : instance
      )
    }))
  }
}));

export const useWhatsAppInstanceState = () => {
  const { instances, isLoading, lastError, setInstances } = useWhatsAppInstanceStore();
  return { instances, isLoading, lastError, setInstances };
};

export const useWhatsAppInstanceActions = () => useWhatsAppInstanceStore((state) => state.actions);
