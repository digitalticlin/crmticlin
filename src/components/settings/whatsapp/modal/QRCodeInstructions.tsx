
import { Smartphone } from "lucide-react";

export const QRCodeInstructions = () => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg w-full">
      <div className="flex items-start gap-3">
        <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-900 mb-1">Como conectar:</p>
          <ol className="text-blue-700 space-y-1 text-xs">
            <li>1. Abra o WhatsApp no seu celular</li>
            <li>2. Vá em ⚙️ <strong>Configurações</strong></li>
            <li>3. Toque em <strong>Aparelhos conectados</strong></li>
            <li>4. Toque em <strong>Conectar um aparelho</strong></li>
            <li>5. Escaneie este QR Code</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
