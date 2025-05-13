
import { create } from 'zustand';

export interface WhatsAppInstance {
  id: string;
  instanceName: string;
  connected: boolean;
  qrCodeUrl?: string;
  phoneNumber?: string;
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
