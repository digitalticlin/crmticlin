
import { create } from 'zustand';

interface WhatsAppInstanceStore {
  instances: any[];
  selectedInstance: any | null;
  setInstances: (instances: any[]) => void;
  setSelectedInstance: (instance: any) => void;
}

export const useWhatsAppInstanceStore = create<WhatsAppInstanceStore>((set) => ({
  instances: [],
  selectedInstance: null,
  setInstances: (instances) => set({ instances }),
  setSelectedInstance: (instance) => set({ selectedInstance: instance }),
}));
