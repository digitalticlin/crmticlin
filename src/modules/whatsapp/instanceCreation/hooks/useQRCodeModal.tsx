
import { create } from 'zustand';

interface QRCodeModalState {
  isOpen: boolean;
  instanceId: string | null;
  instanceName: string | null;
  qrCode: string | null;
  isLoading: boolean;
  error: string | null;
  openModal: (instanceId?: string, instanceName?: string) => void;
  closeModal: () => void;
  refreshQRCode: () => void;
  generateQRCode: () => void;
  setQRCode: (qrCode: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useQRCodeModal = create<QRCodeModalState>((set, get) => ({
  isOpen: false,
  instanceId: null,
  instanceName: null,
  qrCode: null,
  isLoading: false,
  error: null,
  
  openModal: (instanceId?: string, instanceName?: string) => {
    console.log('[QRCodeModal] Opening modal for:', { instanceId, instanceName });
    set({ 
      isOpen: true, 
      instanceId: instanceId || null,
      instanceName: instanceName || null,
      qrCode: null,
      isLoading: true,
      error: null
    });
  },
  
  closeModal: () => {
    console.log('[QRCodeModal] Closing modal');
    set({ 
      isOpen: false, 
      instanceId: null,
      instanceName: null,
      qrCode: null,
      isLoading: false,
      error: null
    });
  },

  refreshQRCode: () => {
    console.log('[QRCodeModal] Refreshing QR code');
    set({ 
      qrCode: null,
      isLoading: true,
      error: null
    });
  },

  generateQRCode: () => {
    console.log('[QRCodeModal] Generating QR code');
    set({ 
      qrCode: null,
      isLoading: true,
      error: null
    });
  },

  setQRCode: (qrCode: string) => {
    console.log('[QRCodeModal] Setting QR code');
    set({ 
      qrCode,
      isLoading: false,
      error: null
    });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ 
      error,
      isLoading: false
    });
  }
}));
