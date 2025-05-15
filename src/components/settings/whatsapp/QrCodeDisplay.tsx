
import React from "react";

interface QrCodeDisplayProps {
  qrUrl: string;
}

export function QrCodeDisplay({ qrUrl }: QrCodeDisplayProps) {
  return (
    <div className="flex justify-center items-center bg-white/15 dark:bg-zinc-700 rounded-xl p-3 mb-4 w-72 h-72 sm:w-80 sm:h-80 shadow-xl border border-white/20 backdrop-blur-md transition-all">
      <img
        src={qrUrl}
        alt="QR Code para conexão do WhatsApp"
        className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-lg border-2 border-green-400 shadow-lg"
        draggable={false}
      />
    </div>
  );
}
