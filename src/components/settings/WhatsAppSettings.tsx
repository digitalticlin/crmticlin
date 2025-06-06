
import { WhatsAppWebSection } from "./whatsapp/WhatsAppWebSection";

const WhatsAppSettings = () => {
  console.log('[WhatsApp Settings] 🎯 Interface Simplificada para Usuário Final');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">WhatsApp</h1>
        <p className="text-gray-600 mt-2">
          Conecte e gerencie suas contas WhatsApp de forma simples
        </p>
      </div>

      <WhatsAppWebSection />
    </div>
  );
};

export default WhatsAppSettings;
