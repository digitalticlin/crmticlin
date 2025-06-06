
import { WhatsAppWebSection } from "./whatsapp/WhatsAppWebSection";

const WhatsAppSettings = () => {
  console.log('[WhatsApp Settings] 🎯 PRODUÇÃO - Sistema Manual Ativo');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações do WhatsApp</h1>
        <p className="text-gray-600 mt-2">
          Sistema manual de criação de instâncias (Produção)
        </p>
      </div>

      <WhatsAppWebSection />
    </div>
  );
};

export default WhatsAppSettings;
