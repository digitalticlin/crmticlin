
import { InstanceSyncControls } from "@/components/whatsapp/InstanceSyncControls";
import { GlobalInstanceManagement } from "@/components/admin/GlobalInstanceManagement";

export default function InstanceSyncTest() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Teste do Sistema de Sincronização
        </h1>
        <p className="text-gray-600 mt-2">
          Criação dual e sincronização de instâncias WhatsApp
        </p>
      </div>

      <InstanceSyncControls />
      
      <GlobalInstanceManagement />
    </div>
  );
}
