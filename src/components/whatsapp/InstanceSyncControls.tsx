
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCcw, Loader2, Plus, Sync } from "lucide-react";
import { useInstanceSyncManager } from "@/hooks/whatsapp/useInstanceSyncManager";
import { useAuth } from "@/contexts/AuthContext";

export const InstanceSyncControls = () => {
  const { createInstanceDual, syncAllInstances, isCreating, isSyncing } = useInstanceSyncManager();
  const { user } = useAuth();

  const handleCreateInstance = async () => {
    if (!user?.email) {
      console.error('Email do usuário não disponível');
      return;
    }

    await createInstanceDual({
      userEmail: user.email,
      companyId: user.id
    });
  };

  const handleSyncInstances = async () => {
    await syncAllInstances();
  };

  return (
    <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sync className="h-5 w-5 text-blue-500" />
          Gerenciamento de Instâncias
        </CardTitle>
        <p className="text-sm text-gray-600">
          Criação dual (DB + VPS) e sincronização de instâncias
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button
            onClick={handleCreateInstance}
            disabled={isCreating}
            className="gap-2 flex-1"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Criar Instância
              </>
            )}
          </Button>

          <Button
            onClick={handleSyncInstances}
            disabled={isSyncing}
            variant="outline"
            className="gap-2 flex-1"
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4" />
                Sincronizar VPS
              </>
            )}
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>✅ Criação dual: Salva no banco E cria na VPS</p>
          <p>✅ Sincronização: Atualiza com instâncias da VPS</p>
          <p>🔒 Não modifica estruturas existentes</p>
        </div>
      </CardContent>
    </Card>
  );
};
