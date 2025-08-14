
import { create } from 'zustand';

interface WhatsAppInstance {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting';
  qr_code?: string;
  phone_number?: string;
}

interface WhatsAppInstanceStore {
  instances: WhatsAppInstance[];
  selectedInstanceId: string | null;
  setInstances: (instances: WhatsAppInstance[]) => void;
  setSelectedInstance: (id: string | null) => void;
  updateInstance: (id: string, updates: Partial<WhatsAppInstance>) => void;
}

export const useWhatsAppInstanceStore = create<WhatsAppInstanceStore>((set) => ({
  instances: [],
  selectedInstanceId: null,
  setInstances: (instances) => set({ instances }),
  setSelectedInstance: (id) => set({ selectedInstanceId: id }),
  updateInstance: (id, updates) =>
    set((state) => ({
      instances: state.instances.map((instance) =>
        instance.id === id ? { ...instance, ...updates } : instance
      ),
    })),
}));
