
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export const SyncInfo = () => {
  return (
    <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-blue-500" />
          Como funcionam as sincronizações
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-600 space-y-3">
        <div>
          <p className="font-medium text-gray-800 mb-1">🔄 Sincronização Completa:</p>
          <p>• Busca todas as instâncias da VPS e compara com o Supabase</p>
          <p>• Cria instâncias órfãs e atualiza dados existentes</p>
        </div>
        
        <div>
          <p className="font-medium text-gray-800 mb-1">⚙️ Sincronizar Status:</p>
          <p>• Configura webhooks globais na VPS</p>
          <p>• Atualiza status de instâncias conectadas que não atualizaram automaticamente</p>
          <p>• Ideal para instâncias criadas antes da configuração de webhooks</p>
        </div>
        
        <div>
          <p className="font-medium text-gray-800 mb-1">👥 Sincronizar Órfãs:</p>
          <p>• Importa instâncias da VPS que não estão no Supabase</p>
          <p>• Cria registros com `created_by_user_id = NULL`</p>
          <p>• Permite gerenciamento manual posterior (excluir ou vincular usuários)</p>
        </div>
      </CardContent>
    </Card>
  );
};
