
import React from "react";

interface ConnectedBannerProps {
  status?: string;
}

export const ConnectedBanner: React.FC<ConnectedBannerProps> = ({ status }) => {
  if (status !== "open") return null;
  return (
    <div className="w-full bg-[#d3d800] bg-opacity-60 rounded-md flex items-center gap-2 p-2 mt-2 mb-3 shadow text-gray-900 font-semibold text-sm justify-center">
      ✅ WhatsApp conectado com sucesso (aguardando mensagens)!
    </div>
  );
};

export default ConnectedBanner;
