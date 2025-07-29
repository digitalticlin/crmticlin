
import { create } from 'zustand';

interface QRCodeModalState {
  isOpen: boolean;
  instanceId: string | null;
  instanceName: string | null;
  openModal: (instanceId?: string, instanceName?: string) => void;
  closeModal: () => void;
}

export const useQRCodeModal = create<QRCodeModalState>((set) => ({
  isOpen: false,
  instanceId: null,
  instanceName: null,
  
  openModal: (instanceId?: string, instanceName?: string) => {
    console.log('[QRCodeModal] Opening modal for:', { instanceId, instanceName });
    set({ 
      isOpen: true, 
      instanceId: instanceId || null,
      instanceName: instanceName || null
    });
  },
  
  closeModal: () => {
    console.log('[QRCodeModal] Closing modal');
    set({ 
      isOpen: false, 
      instanceId: null,
      instanceName: null
    });
  }
}));
