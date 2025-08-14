
import { createContext, useContext, useState, ReactNode } from 'react';

interface QRCodeModalContextType {
  isOpen: boolean;
  qrCode: string | null;
  openModal: (qrCode: string) => void;
  closeModal: () => void;
}

const QRCodeModalContext = createContext<QRCodeModalContextType | undefined>(undefined);

export const useQRCodeModal = () => {
  const context = useContext(QRCodeModalContext);
  if (!context) {
    throw new Error('useQRCodeModal must be used within a QRCodeModalProvider');
  }
  return context;
};

export const QRCodeModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const openModal = (qrCode: string) => {
    setQrCode(qrCode);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setQrCode(null);
  };

  return (
    <QRCodeModalContext.Provider value={{ isOpen, qrCode, openModal, closeModal }}>
      {children}
    </QRCodeModalContext.Provider>
  );
};
