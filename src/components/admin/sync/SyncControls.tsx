
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCcw, Loader2, Globe } from "lucide-react";

interface SyncControlsProps {
  isRunning: boolean;
  isStatusSync: boolean;
  isOrphanSync: boolean;
  onGlobalSync: () => void;
  onStatusSync: () => void;
  onOrphanSync: () => void;
}

export const SyncControls = ({
  isRunning,
  onGlobalSync
}: SyncControlsProps) => {
  return (
    <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-500" />
          Sincronização Completa VPS ↔ Supabase
        </CardTitle>
        <p className="text-sm text-gray-600">
          Sincroniza todas as instâncias da VPS para o Supabase sem deletar dados
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={onGlobalSync}
          disabled={isRunning}
          className="gap-2 w-full"
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sincronizando VPS...
            </>
          ) : (
            <>
              <RefreshCcw className="h-4 w-4" />
              Sincronizar Todas as Instâncias
            </>
          )}
        </Button>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>✅ Adiciona novas instâncias da VPS</p>
          <p>✅ Atualiza dados das existentes</p>
          <p>✅ Preserva vínculos de usuários</p>
          <p>✅ Limpa telefones e bloqueia grupos</p>
          <p>🔒 NUNCA deleta instâncias</p>
        </div>
      </CardContent>
    </Card>
  );
};
