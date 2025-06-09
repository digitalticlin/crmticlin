
import { WhatsAppWebSection } from "./whatsapp/WhatsAppWebSection";

const WhatsAppSettings = () => {
  console.log('[WhatsApp Settings] 🎯 Interface Simplificada para Usuário Final');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações do WhatsApp</h1>
        <p className="text-gray-600 mt-1">
          Gerencie suas conexões WhatsApp para automação de mensagens
        </p>
      </div>

      <WhatsAppWebSection />
    </div>
  );
};

export default WhatsAppSettings;
