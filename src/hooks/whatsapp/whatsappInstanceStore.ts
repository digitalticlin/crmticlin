
import { create } from 'zustand';

export interface WhatsAppInstance {
  id: string;
  instanceName: string;
  connected?: boolean;
  status?: 'connected' | 'connecting' | 'disconnected';
  qrCodeUrl?: string;
  phoneNumber?: string;
  lastUpdated?: Date;
}

export interface WhatsAppInstanceState {
  instances: WhatsAppInstance[];
  setInstances: (instances: WhatsAppInstance[]) => void;
}

export interface WhatsAppInstanceActions {
  updateInstance: (id: string, updates: Partial<WhatsAppInstance>) => void;
  removeInstance: (id: string) => void;
  addInstance: (instance: WhatsAppInstance) => void;
}

export const useWhatsAppInstanceState = create<WhatsAppInstanceState>((set) => ({
  instances: [],
  setInstances: (instances) => set({ instances }),
}));

export const useWhatsAppInstanceActions = create<WhatsAppInstanceActions>((set, get) => ({
  updateInstance: (id, updates) => {
    const { instances } = useWhatsAppInstanceState.getState();
    const updatedInstances = instances.map(instance => 
      instance.id === id ? { ...instance, ...updates } : instance
    );
    useWhatsAppInstanceState.setState({ instances: updatedInstances });
  },
  
  removeInstance: (id) => {
    const { instances } = useWhatsAppInstanceState.getState();
    const filteredInstances = instances.filter(instance => instance.id !== id);
    useWhatsAppInstanceState.setState({ instances: filteredInstances });
  },
  
  addInstance: (instance) => {
    const { instances } = useWhatsAppInstanceState.getState();
    // Check if instance already exists to prevent duplicates
    if (instances.some(i => i.id === instance.id)) {
      console.log("Instância já existe, não adicionando duplicata:", instance.id);
      return;
    }
    const updatedInstances = [...instances, instance];
    useWhatsAppInstanceState.setState({ instances: updatedInstances });
    console.log("Instance added to store:", instance);
  }
}));
