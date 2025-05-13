
import { create } from 'zustand';

export interface WhatsAppInstance {
  id: string;
  instanceName: string;
  connected: boolean;
  qrCodeUrl?: string;
}

interface WhatsAppInstanceState {
  instances: WhatsAppInstance[];
  isLoading: Record<string, boolean>;
  lastError: string | null;
}

interface WhatsAppInstanceActions {
  setInstances: (instances: WhatsAppInstance[]) => void;
  setLoading: (instanceId: string, isLoading: boolean) => void;
  setError: (error: string | null) => void;
  updateInstance: (instanceId: string, instance: Partial<WhatsAppInstance>) => void;
}

const useWhatsAppInstanceStore = create<WhatsAppInstanceState & { actions: WhatsAppInstanceActions }>((set) => ({
  instances: [],
  isLoading: {},
  lastError: null,
  actions: {
    setInstances: (instances) => set({ instances }),
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
  const { instances, isLoading, lastError } = useWhatsAppInstanceStore();
  return { instances, isLoading, lastError };
};

export const useWhatsAppInstanceActions = () => useWhatsAppInstanceStore((state) => state.actions);
