/**
 * 🏪 WHATSAPP INSTANCE STORE
 * Store temporário para gerenciar estado de instâncias WhatsApp
 */

import { create } from 'zustand';

// Tipo temporário para WhatsApp Instance
export interface WhatsAppInstance {
  id: string;
  instanceName: string;
  status: string;
  phone?: string;
  profileName?: string;
  deviceInfo?: {
    batteryLevel?: number;
    lastSeen?: string;
    model?: string;
  };
}

interface WhatsAppInstanceState {
  selectedInstanceId: string | null;
  isConnecting: boolean;
  connectionStatus: string;
  setSelectedInstance: (id: string | null) => void;
  setConnecting: (connecting: boolean) => void;
  setConnectionStatus: (status: string) => void;
}

export const useWhatsAppInstanceStore = create<WhatsAppInstanceState>((set) => ({
  selectedInstanceId: null,
  isConnecting: false,
  connectionStatus: 'disconnected',
  setSelectedInstance: (id) => set({ selectedInstanceId: id }),
  setConnecting: (connecting) => set({ isConnecting: connecting }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
}));