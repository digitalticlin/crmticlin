
import { EdgeFunctionVersionManager } from "@/components/admin/EdgeFunctionVersionManager";
import { MessageHistoryAnalyzer } from "@/components/admin/MessageHistoryAnalyzer";

const EdgeFunctionRecovery = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Recuperação da Edge Function</h1>
        <p className="text-gray-600">
          Análise e restauração da edge function do webhook WhatsApp para uma versão funcional
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <MessageHistoryAnalyzer />
        <EdgeFunctionVersionManager />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-800 mb-2">Próximos Passos Recomendados:</h3>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li>Analisar o histórico de mensagens para identificar quando pararam de ser salvas</li>
          <li>Restaurar a versão simples que salva mensagens diretamente na tabela</li>
          <li>Testar o webhook enviando uma mensagem WhatsApp</li>
          <li>Monitorar os logs da edge function para confirmar funcionamento</li>
          <li>Depois de estabilizar, reimplementar funcionalidades de leads se necessário</li>
        </ol>
      </div>
    </div>
  );
};

export default EdgeFunctionRecovery;
