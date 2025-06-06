
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RefreshCcw, Settings, Users, Loader2, Globe } from "lucide-react";

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
  isStatusSync,
  isOrphanSync,
  onGlobalSync,
  onStatusSync,
  onOrphanSync
}: SyncControlsProps) => {
  const isAnyRunning = isRunning || isStatusSync || isOrphanSync;

  return (
    <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-500" />
          Sincronização Global de Instâncias
        </CardTitle>
        <p className="text-sm text-gray-600">
          Gerencie e sincronize todas as instâncias da VPS com o Supabase
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sincronização Completa */}
        <Button
          onClick={onGlobalSync}
          disabled={isAnyRunning}
          className="gap-2 w-full"
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCcw className="h-4 w-4" />
              Sincronização Completa
            </>
          )}
        </Button>

        <Separator />

        {/* Sincronizações Específicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sincronizar Status */}
          <Button
            onClick={onStatusSync}
            disabled={isAnyRunning}
            variant="outline"
            className="gap-2 h-auto p-4 flex-col items-start"
          >
            {isStatusSync ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Configurando...
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 w-full">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">Sincronizar Status</span>
                </div>
                <span className="text-xs text-gray-500 text-left">
                  Configura webhooks e atualiza status de instâncias conectadas
                </span>
              </>
            )}
          </Button>

          {/* Sincronizar Órfãs */}
          <Button
            onClick={onOrphanSync}
            disabled={isAnyRunning}
            variant="outline"
            className="gap-2 h-auto p-4 flex-col items-start"
          >
            {isOrphanSync ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 w-full">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Sincronizar Órfãs</span>
                </div>
                <span className="text-xs text-gray-500 text-left">
                  Importa instâncias não vinculadas da VPS
                </span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
