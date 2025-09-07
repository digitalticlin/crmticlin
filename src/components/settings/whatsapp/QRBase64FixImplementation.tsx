/**
 * 🔧 QR BASE64 FIX IMPLEMENTATION
 * Componente temporário para corrigir implementação de QR Code
 */

import React from 'react';

interface QRBase64FixProps {
  qrCode?: string;
  className?: string;
}

export const QRBase64FixImplementation: React.FC<QRBase64FixProps> = ({ 
  qrCode, 
  className = "w-64 h-64" 
}) => {
  if (!qrCode) return null;

  return (
    <div className={className}>
      <img 
        src={qrCode} 
        alt="QR Code"
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default QRBase64FixImplementation;