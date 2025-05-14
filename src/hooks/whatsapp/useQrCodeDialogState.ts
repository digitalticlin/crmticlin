
import { useState } from "react";

// Expõe estado e handlers para controlar exibição do card QRCode
export function useQrCodeDialogState() {
  const [isOpen, setIsOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const show = (url: string) => {
    setQrCodeUrl(url);
    setIsOpen(true);
  };
  const hide = () => {
    setIsOpen(false);
    setQrCodeUrl(null);
  };
  return { isOpen, setIsOpen, qrCodeUrl, setQrCodeUrl, show, hide };
}
