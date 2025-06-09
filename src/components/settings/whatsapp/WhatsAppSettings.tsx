
import { VPSConnectivityTest } from "./VPSConnectivityTest";
import { VPSAutoInstaller } from "./VPSAutoInstaller";

export const WhatsAppSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Configurações WhatsApp</h2>
        <p className="text-gray-600">
          Configure e teste a conectividade com o servidor WhatsApp
        </p>
      </div>

      {/* Instalador Automático - NOVA funcionalidade */}
      <VPSAutoInstaller />
      
      {/* Teste de Conectividade - Existente */}
      <VPSConnectivityTest />
    </div>
  );
};
